from __future__ import annotations

from datetime import datetime
from typing import Literal

from beanie import Document as BeanieDocument, Indexed
from pydantic import Field


class UploadedDocument(BeanieDocument):
    user_id: Indexed(str)
    original_filename: str
    stored_filename: str
    stored_path: str
    content_type: str
    file_size: int
    file_hash: Indexed(str)
    upload_date: datetime = Field(default_factory=datetime.utcnow)
    status: Literal["uploaded", "processed", "failed"] = "uploaded"
    extracted_text_path: str | None = None

    class Settings:
        name = "documents"
