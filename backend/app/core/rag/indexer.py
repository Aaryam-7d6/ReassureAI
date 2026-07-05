"""
RAG indexing boundary.

TASK-011 originally included chunking, embedding, and indexing in the backend.
For this project those ingestion steps are intentionally performed in Google
Colab, then uploaded into Qdrant Cloud. Keep this module as a small boundary so
future backend code does not accidentally grow a second ingestion pipeline.
"""


class BackendIndexingDisabled(RuntimeError):
    """Raised when backend code tries to run Colab-owned ingestion work."""


class Indexer:
    """Placeholder that documents the ingestion ownership decision."""

    def build_local_index(self, *args, **kwargs):
        raise BackendIndexingDisabled(
            "Document chunking, embedding, and upload are handled in Google Colab. "
            "Use backend.app.core.rag.retriever.HybridRetriever for search."
        )
