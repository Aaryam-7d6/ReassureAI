from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, File, Header, HTTPException, Request, Response, UploadFile, status

from backend import config
from backend.app.core.files.dedup import FileDeduplicator
from backend.app.core.files.extractor import FileExtractionError, FileExtractor
from backend.app.core.pipeline.disigen import DisigenNode
from backend.app.db.connection import get_db


router = APIRouter(prefix="/reports", tags=["reports"])

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
}


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_report(
    request: Request,
    response: Response,
    file: UploadFile = File(...),
    db=Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    user_id = _resolve_user_id(request, x_user_id)
    original_filename = file.filename or "upload"
    content_type = file.content_type or "application/octet-stream"
    _validate_upload_metadata(original_filename, content_type)

    file_bytes = await file.read()
    _validate_upload_size(file_bytes)

    file_hash = FileDeduplicator.sha256_bytes(file_bytes)
    duplicate = await FileDeduplicator.find_duplicate(db, user_id, file_hash)
    if duplicate:
        response.status_code = status.HTTP_200_OK
        payload = _serialize_report(duplicate)
        payload["duplicate"] = True
        payload["message"] = "We've processed this report before, returning the saved result."
        return payload

    user_upload_dir = Path(config.UPLOAD_DIR) / user_id
    user_upload_dir.mkdir(parents=True, exist_ok=True)

    stored_filename = f"{uuid4().hex}_{_safe_filename(original_filename)}"
    stored_path = user_upload_dir / stored_filename
    stored_path.write_bytes(file_bytes)

    document = {
        "user_id": user_id,
        "original_filename": original_filename,
        "stored_filename": stored_filename,
        "stored_path": str(stored_path),
        "content_type": content_type,
        "file_size": len(file_bytes),
        "file_hash": file_hash,
        "upload_date": datetime.utcnow(),
        "status": "uploaded",
        "extracted_text_path": None,
    }
    insert_result = await db.documents.insert_one(document)
    document_id = insert_result.inserted_id

    status_value = "failed"
    extracted_text = ""
    extracted_text_path = None
    simplified_report = None
    simplified_report_path = None
    try:
        extracted_text = FileExtractor.extract(stored_path)
        extracted_text_path = str(stored_path.with_suffix(stored_path.suffix + ".txt"))
        Path(extracted_text_path).write_text(extracted_text, encoding="utf-8")
        simplified_report = await _simplify_report(extracted_text)
        simplified_report_path = str(stored_path.with_suffix(stored_path.suffix + ".summary.md"))
        Path(simplified_report_path).write_text(simplified_report, encoding="utf-8")
        status_value = "processed"
    except FileExtractionError:
        status_value = "failed"

    await db.documents.update_one(
        {"_id": document_id},
        {
            "$set": {
                "status": status_value,
                "extracted_text_path": extracted_text_path,
                "extracted_text": extracted_text,
                "simplified_report": simplified_report,
                "simplified_report_path": simplified_report_path,
                "processed_at": datetime.utcnow(),
            }
        },
    )

    return {
        "document_id": str(document_id),
        "duplicate": False,
        "status": status_value,
        "original_filename": original_filename,
        "stored_filename": stored_filename,
        "stored_path": str(stored_path),
        "extracted_text_path": extracted_text_path,
        "simplified_report": simplified_report,
        "simplified_report_path": simplified_report_path,
    }


@router.get("")
async def list_reports(
    request: Request,
    db=Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    user_id = _resolve_user_id(request, x_user_id)
    cursor = db.documents.find({"user_id": user_id}).sort("upload_date", -1)
    return {"reports": [_serialize_report(report) async for report in cursor]}


@router.get("/{document_id}")
async def get_report(
    document_id: str,
    request: Request,
    db=Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    user_id = _resolve_user_id(request, x_user_id)
    report = await db.documents.find_one({"_id": _to_object_id(document_id), "user_id": user_id})
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return _serialize_report(report)


def _resolve_user_id(request: Request, x_user_id: str | None) -> str:
    if x_user_id:
        return x_user_id

    token = request.cookies.get("access_token")
    authorization = request.headers.get("Authorization")
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1]

    if token:
        try:
            import jwt

            payload = jwt.decode(token, config.cfg.JWT_SECRET, algorithms=[config.cfg.JWT_ALGORITHM])
            subject = payload.get("sub")
            if subject:
                return str(subject)
        except Exception:
            pass

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")


def _validate_upload_metadata(filename: str, content_type: str) -> None:
    extension = Path(filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS or content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Upload a PDF, PNG, JPG, or JPEG file.",
        )


def _validate_upload_size(file_bytes: bytes) -> None:
    if not file_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")
    if len(file_bytes) > config.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File exceeds 10MB limit")


def _safe_filename(filename: str) -> str:
    name = Path(filename).name.strip().replace(" ", "_")
    return re.sub(r"[^A-Za-z0-9._-]", "_", name) or "upload"


async def _simplify_report(extracted_text: str) -> str:
    result = await DisigenNode().process_query(
        "Simplify this uploaded medical report.",
        file_content=extracted_text,
    )
    return result.response


def _to_object_id(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid report id")


def _serialize_report(report: dict) -> dict:
    return {
        "document_id": str(report["_id"]),
        "original_filename": report.get("original_filename"),
        "stored_filename": report.get("stored_filename"),
        "stored_path": report.get("stored_path"),
        "content_type": report.get("content_type"),
        "file_size": report.get("file_size"),
        "status": report.get("status"),
        "upload_date": _serialize_datetime(report.get("upload_date")),
        "extracted_text_path": report.get("extracted_text_path"),
        "simplified_report": report.get("simplified_report"),
        "simplified_report_path": report.get("simplified_report_path"),
    }


def _serialize_datetime(value):
    if isinstance(value, datetime):
        return value.isoformat()
    return value
