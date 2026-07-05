"""
Small async Qdrant HTTP client used by the hybrid retriever.

The Colab notebook owns collection creation, chunking, dense vectors, sparse
vectors, and payload upload. This client only queries an existing collection.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import httpx

from backend.config import cfg


@dataclass
class QdrantHit:
    id: str
    score: float
    text: str
    payload: Dict[str, Any] = field(default_factory=dict)
    source: str = "qdrant"


class QdrantClient:
    def __init__(
        self,
        url: str | None = None,
        api_key: str | None = None,
        text_payload_key: str | None = None,
        dense_vector_name: str | None = None,
        sparse_vector_name: str | None = None,
        timeout: float = 20.0,
    ):
        self.url = (url or cfg.QDRANT_URL).rstrip("/")
        self.api_key = api_key if api_key is not None else cfg.QDRANT_API_KEY
        self.text_payload_key = text_payload_key or cfg.QDRANT_TEXT_PAYLOAD_KEY
        self.dense_vector_name = dense_vector_name if dense_vector_name is not None else cfg.QDRANT_DENSE_VECTOR_NAME
        self.sparse_vector_name = sparse_vector_name or cfg.QDRANT_SPARSE_VECTOR_NAME
        self.timeout = timeout

    @property
    def is_configured(self) -> bool:
        return bool(self.url)

    def _headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["api-key"] = self.api_key
        return headers

    def _hit_from_point(self, point: Dict[str, Any], source: str) -> QdrantHit:
        payload = point.get("payload") or {}
        return QdrantHit(
            id=str(point.get("id")),
            score=float(point.get("score", 0.0)),
            text=str(payload.get(self.text_payload_key, "")),
            payload=payload,
            source=source,
        )

    async def search_dense(
        self,
        collection: str,
        query_vector: List[float],
        top_k: int = 8,
    ) -> List[QdrantHit]:
        """Run dense vector similarity search against Qdrant."""
        if not self.is_configured or not query_vector:
            return []

        vector: Any = query_vector
        if self.dense_vector_name:
            vector = {"name": self.dense_vector_name, "vector": query_vector}

        payload = {
            "vector": vector,
            "limit": top_k,
            "with_payload": True,
            "with_vector": False,
        }
        endpoint = f"{self.url}/collections/{collection}/points/search"

        async with httpx.AsyncClient(timeout=self.timeout, headers=self._headers()) as client:
            response = await client.post(endpoint, json=payload)
            response.raise_for_status()
            data = response.json()

        return [self._hit_from_point(point, "dense") for point in data.get("result", [])]

    async def search_sparse(
        self,
        collection: str,
        sparse_vector: Dict[str, List[float] | List[int]],
        top_k: int = 8,
    ) -> List[QdrantHit]:
        """Run sparse vector search when Colab uploaded sparse vectors."""
        if not self.is_configured or not sparse_vector:
            return []

        payload = {
            "query": {
                "indices": sparse_vector.get("indices", []),
                "values": sparse_vector.get("values", []),
            },
            "using": self.sparse_vector_name,
            "limit": top_k,
            "with_payload": True,
            "with_vector": False,
        }
        endpoint = f"{self.url}/collections/{collection}/points/query"

        async with httpx.AsyncClient(timeout=self.timeout, headers=self._headers()) as client:
            response = await client.post(endpoint, json=payload)
            response.raise_for_status()
            data = response.json()

        return [self._hit_from_point(point, "sparse") for point in data.get("result", {}).get("points", [])]

    async def search_keywords(
        self,
        collection: str,
        terms: List[str],
        top_k: int = 8,
    ) -> List[QdrantHit]:
        """
        Search exact keywords/phrases from the text payload.

        This expects the Colab ingestion step to create a Qdrant full-text index
        on the configured text payload key. If no such index exists, Qdrant will
        return an error and the retriever will still use dense/sparse results.
        """
        clean_terms = [term.strip() for term in terms if term.strip()]
        if not self.is_configured or not clean_terms:
            return []

        should = [
            {"key": self.text_payload_key, "match": {"text": term}}
            for term in clean_terms
        ]
        payload = {
            "filter": {"should": should},
            "limit": top_k,
            "with_payload": True,
            "with_vector": False,
        }
        endpoint = f"{self.url}/collections/{collection}/points/scroll"

        async with httpx.AsyncClient(timeout=self.timeout, headers=self._headers()) as client:
            response = await client.post(endpoint, json=payload)
            response.raise_for_status()
            data = response.json()

        points = data.get("result", {}).get("points", [])
        return [self._hit_from_point(point, "keyword") for point in points]
