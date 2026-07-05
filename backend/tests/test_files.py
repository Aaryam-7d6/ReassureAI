from __future__ import annotations

from io import BytesIO
from types import SimpleNamespace

import pytest
from bson import ObjectId
from fastapi import HTTPException
from starlette.responses import Response
from starlette.datastructures import Headers, UploadFile

from backend.app.api.v1.endpoints import reports
from backend.app.core.files import extractor
from backend.app.core.files.dedup import FileDeduplicator
from backend.app.core.files.extractor import FileExtractor


def test_sha256_bytes_is_stable():
    first = FileDeduplicator.sha256_bytes(b"same report bytes")
    second = FileDeduplicator.sha256_bytes(b"same report bytes")

    assert first == second
    assert len(first) == 64


def test_pdf_uses_ocr_when_pypdf2_extracts_no_text(monkeypatch, tmp_path):
    pdf_path = tmp_path / "scan.pdf"
    pdf_path.write_bytes(b"%PDF scanned placeholder")

    monkeypatch.setattr(extractor, "_extract_pdf_text_with_pypdf2", lambda path: "")
    monkeypatch.setattr(extractor, "_ocr_pdf", lambda path: "HbA1c is 8.1 and flagged high")

    assert FileExtractor.extract_text_from_pdf(pdf_path) == "HbA1c is 8.1 and flagged high"


def test_pdf_prefers_pypdf2_when_text_is_available(monkeypatch, tmp_path):
    pdf_path = tmp_path / "digital.pdf"
    pdf_path.write_bytes(b"%PDF digital placeholder")

    monkeypatch.setattr(extractor, "_extract_pdf_text_with_pypdf2", lambda path: "Readable lab report text")
    monkeypatch.setattr(extractor, "_ocr_pdf", lambda path: pytest.fail("OCR should not run"))

    assert FileExtractor.extract_text_from_pdf(pdf_path) == "Readable lab report text"


def test_upload_rejects_unsupported_file_type():
    with pytest.raises(HTTPException) as exc:
        reports._validate_upload_metadata("notes.txt", "text/plain")

    assert exc.value.status_code == 400


def test_upload_rejects_files_over_10mb(monkeypatch):
    monkeypatch.setattr(reports.config, "MAX_UPLOAD_SIZE_BYTES", 4)

    with pytest.raises(HTTPException) as exc:
        reports._validate_upload_size(b"12345")

    assert exc.value.status_code == 413


@pytest.mark.asyncio
async def test_upload_saves_document_and_extracted_text(monkeypatch, tmp_path):
    db = FakeDb()
    monkeypatch.setattr(reports.config, "UPLOAD_DIR", str(tmp_path))
    monkeypatch.setattr(reports.FileExtractor, "extract", lambda path: "extracted report text")
    monkeypatch.setattr(reports, "_simplify_report", async_return("## Simplified report"))

    upload = UploadFile(
        file=BytesIO(b"report bytes"),
        filename="blood report.pdf",
        headers=Headers({"content-type": "application/pdf"}),
    )
    request = SimpleNamespace(cookies={}, headers={})

    result = await reports.upload_report(request, Response(), upload, db=db, x_user_id="user-123")

    assert result["duplicate"] is False
    assert result["status"] == "processed"
    assert result["document_id"] == "doc-1"
    assert "user-123" in result["stored_path"]
    assert result["stored_filename"].endswith("_blood_report.pdf")
    assert result["simplified_report"] == "## Simplified report"
    assert db.documents.inserted["file_hash"] == FileDeduplicator.sha256_bytes(b"report bytes")


@pytest.mark.asyncio
async def test_upload_returns_existing_duplicate(monkeypatch, tmp_path):
    file_hash = FileDeduplicator.sha256_bytes(b"same file")
    db = FakeDb(
        duplicate={
            "_id": ObjectId(),
            "user_id": "user-123",
            "file_hash": file_hash,
            "status": "processed",
            "original_filename": "old.pdf",
            "simplified_report": "cached summary",
        }
    )
    monkeypatch.setattr(reports.config, "UPLOAD_DIR", str(tmp_path))

    upload = UploadFile(
        file=BytesIO(b"same file"),
        filename="new.pdf",
        headers=Headers({"content-type": "application/pdf"}),
    )
    request = SimpleNamespace(cookies={}, headers={})

    response = Response()

    result = await reports.upload_report(request, response, upload, db=db, x_user_id="user-123")

    assert result["duplicate"] is True
    assert result["simplified_report"] == "cached summary"
    assert response.status_code == 200
    assert db.documents.inserted is None


@pytest.mark.asyncio
async def test_list_and_get_reports_for_user():
    document_id = ObjectId()
    db = FakeDb(
        documents=[
            {
                "_id": document_id,
                "user_id": "user-123",
                "original_filename": "blood.pdf",
                "stored_filename": "uuid_blood.pdf",
                "stored_path": "/tmp/user-123/uuid_blood.pdf",
                "content_type": "application/pdf",
                "file_size": 12,
                "file_hash": "hash",
                "upload_date": reports.datetime.utcnow(),
                "status": "processed",
                "simplified_report": "summary",
            }
        ]
    )
    request = SimpleNamespace(cookies={}, headers={})

    listed = await reports.list_reports(request, db=db, x_user_id="user-123")
    detail = await reports.get_report(str(document_id), request, db=db, x_user_id="user-123")

    assert listed["reports"][0]["document_id"] == str(document_id)
    assert detail["simplified_report"] == "summary"


def async_return(value):
    async def _inner(*_args, **_kwargs):
        return value

    return _inner


class FakeDb:
    def __init__(self, duplicate=None, documents=None):
        self.documents = FakeDocuments(duplicate, documents or [])


class FakeDocuments:
    def __init__(self, duplicate=None, documents=None):
        self.duplicate = duplicate
        self.documents = list(documents or [])
        self.inserted = None
        self.updated = None

    async def find_one(self, query):
        if self.duplicate and query.get("file_hash") == self.duplicate["file_hash"]:
            return self.duplicate
        for document in self.documents:
            if all(document.get(key) == value for key, value in query.items()):
                return document
        return None

    async def insert_one(self, document):
        self.inserted = document
        self.documents.append({**document, "_id": "doc-1"})
        return SimpleNamespace(inserted_id="doc-1")

    async def update_one(self, query, update):
        self.updated = (query, update)
        for document in self.documents:
            if document.get("_id") == query.get("_id"):
                document.update(update.get("$set", {}))
        return SimpleNamespace(modified_count=1)

    def find(self, query):
        return FakeCursor(
            [
                document
                for document in self.documents
                if all(document.get(key) == value for key, value in query.items())
            ]
        )


class FakeCursor:
    def __init__(self, documents):
        self.documents = list(documents)

    def sort(self, key, direction):
        self.documents.sort(key=lambda document: document.get(key) or reports.datetime.min, reverse=direction < 0)
        return self

    def __aiter__(self):
        self._index = 0
        return self

    async def __anext__(self):
        if self._index >= len(self.documents):
            raise StopAsyncIteration
        item = self.documents[self._index]
        self._index += 1
        return item
