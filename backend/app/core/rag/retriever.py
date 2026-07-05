"""
Hybrid retrieval: dense similarity + sparse/exact keyword search.

Colab owns ingestion. This module owns query-time retrieval and result fusion.
"""

from __future__ import annotations

import math
import logging
import re
from dataclasses import dataclass, field
from typing import Any, Dict, Iterable, List, Optional, Sequence

from backend.config import cfg
from backend.app.core.rag.embedder import Embedder, EmbeddingUnavailableError
from backend.app.core.rag.qdrant_client import QdrantClient, QdrantHit


TOKEN_RE = re.compile(r"[a-z0-9]+")
PHRASE_RE = re.compile(r'"([^"]+)"')
logger = logging.getLogger(__name__)


@dataclass
class RagDocument:
    id: str
    text: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    vector: Optional[List[float]] = None


@dataclass
class RetrievalResult:
    id: str
    text: str
    score: float
    sources: List[str]
    metadata: Dict[str, Any] = field(default_factory=dict)


def tokenize(text: str) -> List[str]:
    return TOKEN_RE.findall(text.lower())


def exact_terms(query: str) -> List[str]:
    phrases = [match.strip().lower() for match in PHRASE_RE.findall(query)]
    tokens = tokenize(query)
    seen = set()
    terms = []
    for term in phrases + tokens:
        if term and term not in seen:
            seen.add(term)
            terms.append(term)
    return terms


def cosine_similarity(a: Sequence[float], b: Sequence[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


class HybridRetriever:
    """
    Retrieve context with dense vectors and lexical keyword matching.

    For production, configure QDRANT_URL and query an existing Colab-ingested
    collection. For tests/local dev, pass RagDocument objects directly.
    """

    def __init__(
        self,
        documents: Optional[Iterable[RagDocument]] = None,
        qdrant_client: Optional[QdrantClient] = None,
        embedder: Optional[Embedder] = None,
        collection: Optional[str] = None,
        use_qdrant: Optional[bool] = None,
        rrf_k: int = 60,
    ):
        self.documents = list(documents or [])
        self.qdrant = qdrant_client or QdrantClient()
        self.embedder = embedder
        self.collection = collection or cfg.RAG_DEFAULT_COLLECTION
        self.use_qdrant = (self.qdrant.is_configured and not self.documents) if use_qdrant is None else use_qdrant
        self.rrf_k = rrf_k

    async def retrieve(
        self,
        query: str,
        top_k: int = 5,
        query_vector: Optional[List[float]] = None,
        sparse_vector: Optional[Dict[str, List[float] | List[int]]] = None,
        collection: Optional[str] = None,
    ) -> List[RetrievalResult]:
        if not query.strip():
            return []

        search_collection = collection or self.collection
        if self.use_qdrant:
            return await self._retrieve_qdrant(
                query=query,
                query_vector=query_vector,
                sparse_vector=sparse_vector,
                collection=search_collection,
                top_k=top_k,
            )

        return self._retrieve_local(query=query, query_vector=query_vector, top_k=top_k)

    async def _retrieve_qdrant(
        self,
        query: str,
        query_vector: Optional[List[float]],
        sparse_vector: Optional[Dict[str, List[float] | List[int]]],
        collection: str,
        top_k: int,
    ) -> List[RetrievalResult]:
        dense_vector = query_vector
        if dense_vector is None:
            dense_vector = self._embed_query_or_none(query)

        ranked_lists: List[List[RetrievalResult]] = []

        if dense_vector:
            try:
                dense_hits = await self.qdrant.search_dense(collection, dense_vector, top_k=top_k * 2)
                ranked_lists.append(self._qdrant_hits_to_results(dense_hits))
            except Exception as exc:
                logger.warning("Qdrant dense search failed: %s", exc)

        if sparse_vector:
            try:
                sparse_hits = await self.qdrant.search_sparse(collection, sparse_vector, top_k=top_k * 2)
                ranked_lists.append(self._qdrant_hits_to_results(sparse_hits))
            except Exception as exc:
                logger.warning("Qdrant sparse search failed: %s", exc)

        try:
            keyword_hits = await self.qdrant.search_keywords(collection, exact_terms(query), top_k=top_k * 2)
            ranked_lists.append(self._qdrant_hits_to_results(keyword_hits))
        except Exception as exc:
            logger.warning("Qdrant keyword search failed: %s", exc)

        return self._rrf(ranked_lists, top_k=top_k)

    def _retrieve_local(
        self,
        query: str,
        query_vector: Optional[List[float]],
        top_k: int,
    ) -> List[RetrievalResult]:
        dense_ranked: List[RetrievalResult] = []
        keyword_ranked: List[RetrievalResult] = []

        if query_vector:
            dense_ranked = self._local_dense(query_vector)

        keyword_ranked = self._local_keyword(query)
        return self._rrf([dense_ranked, keyword_ranked], top_k=top_k)

    def _local_dense(self, query_vector: List[float]) -> List[RetrievalResult]:
        results = []
        for doc in self.documents:
            score = cosine_similarity(query_vector, doc.vector or [])
            if score > 0:
                results.append(
                    RetrievalResult(
                        id=doc.id,
                        text=doc.text,
                        score=score,
                        sources=["dense"],
                        metadata=doc.metadata,
                    )
                )
        return sorted(results, key=lambda item: item.score, reverse=True)

    def _local_keyword(self, query: str) -> List[RetrievalResult]:
        terms = exact_terms(query)
        query_tokens = set(tokenize(query))
        results = []

        for doc in self.documents:
            text_lower = doc.text.lower()
            doc_tokens = tokenize(doc.text)
            token_set = set(doc_tokens)
            exact_hits = sum(
                1
                for term in terms
                if (term in text_lower if " " in term else term in token_set)
            )
            token_hits = len(query_tokens & token_set)
            if exact_hits == 0 and token_hits == 0:
                continue

            score = float((exact_hits * 3) + token_hits)
            results.append(
                RetrievalResult(
                    id=doc.id,
                    text=doc.text,
                    score=score,
                    sources=["keyword"],
                    metadata=doc.metadata,
                )
            )

        return sorted(results, key=lambda item: item.score, reverse=True)

    def _embed_query_or_none(self, query: str) -> Optional[List[float]]:
        embedder = self.embedder or Embedder()
        try:
            return embedder.embed_query(query)
        except EmbeddingUnavailableError:
            return None

    def _qdrant_hits_to_results(self, hits: List[QdrantHit]) -> List[RetrievalResult]:
        return [
            RetrievalResult(
                id=hit.id,
                text=hit.text,
                score=hit.score,
                sources=[hit.source],
                metadata=hit.payload,
            )
            for hit in hits
            if hit.text
        ]

    def _rrf(
        self,
        ranked_lists: List[List[RetrievalResult]],
        top_k: int,
    ) -> List[RetrievalResult]:
        fused: Dict[str, RetrievalResult] = {}
        scores: Dict[str, float] = {}
        source_sets: Dict[str, set[str]] = {}

        for ranked in ranked_lists:
            for rank, result in enumerate(ranked, start=1):
                key = result.id
                if key not in fused:
                    fused[key] = result
                    scores[key] = 0.0
                    source_sets[key] = set(result.sources)
                else:
                    source_sets[key].update(result.sources)
                scores[key] += 1.0 / (self.rrf_k + rank)

        ordered = sorted(scores, key=scores.get, reverse=True)
        output = []
        for key in ordered[:top_k]:
            item = fused[key]
            item.score = scores[key]
            item.sources = sorted(source_sets[key])
            output.append(item)
        return output
