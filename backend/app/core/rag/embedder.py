"""
Query embedding helper for RAG retrieval.

Document chunking, document embeddings, and uploads are handled in Google
Colab. This backend helper is only for embedding user queries when a dense
query vector is not supplied by the caller.
"""

from __future__ import annotations

from typing import Iterable, List

from backend.config import cfg


class EmbeddingUnavailableError(RuntimeError):
    """Raised when sentence-transformers is not installed locally."""


class Embedder:
    """Lazy sentence-transformers wrapper for query-time embeddings."""

    def __init__(self, model_name: str | None = None):
        self.model_name = model_name or cfg.EMBEDDING_MODEL_NAME
        self._model = None

    @property
    def model(self):
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
            except ImportError as exc:
                raise EmbeddingUnavailableError(
                    "Install sentence-transformers or pass query_vector directly "
                    "to HybridRetriever.retrieve()."
                ) from exc
            self._model = SentenceTransformer(self.model_name)
        return self._model

    def embed(self, texts: Iterable[str]) -> List[List[float]]:
        values = list(texts)
        if not values:
            return []
        vectors = self.model.encode(
            values,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return vectors.tolist()

    def embed_query(self, query: str) -> List[float]:
        return self.embed([query])[0]
