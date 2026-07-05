from __future__ import annotations

import hashlib
from pathlib import Path


class FileDeduplicator:
    @staticmethod
    def sha256_bytes(file_bytes: bytes) -> str:
        return hashlib.sha256(file_bytes).hexdigest()

    @staticmethod
    def sha256_file(file_path: str | Path, chunk_size: int = 1024 * 1024) -> str:
        digest = hashlib.sha256()
        with Path(file_path).open("rb") as file_obj:
            for chunk in iter(lambda: file_obj.read(chunk_size), b""):
                digest.update(chunk)
        return digest.hexdigest()

    @staticmethod
    async def find_duplicate(db, user_id: str, file_hash: str) -> dict | None:
        return await db.documents.find_one({"user_id": user_id, "file_hash": file_hash})
