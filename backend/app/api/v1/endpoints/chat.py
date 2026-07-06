from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import uuid4

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from pydantic import BaseModel, Field

from backend import config
from backend.app.core.pipeline.disigen import DisigenNode
from backend.app.db.connection import get_db


router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1)
    conversation_id: str | None = None
    guardian_email: str | None = None
    file_content: str | None = None
    processing_type: str | None = None


@router.post("")
async def create_chat_message(
    payload: ChatRequest,
    request: Request,
    db=Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    user_id = _resolve_user_id(request, x_user_id)
    query = payload.query.strip()
    if not query and not payload.file_content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Query cannot be empty")

    node = DisigenNode()
    result = await node.process_query(
        query,
        user_id=user_id,
        guardian_email=payload.guardian_email,
        file_content=payload.file_content,
        processing_type=payload.processing_type,
    )
    result_payload = _serialize_disigen_result(result)

    now = datetime.utcnow()
    user_message = {
        "id": uuid4().hex,
        "role": "user",
        "content": query,
        "timestamp": now,
    }
    assistant_message = {
        "id": uuid4().hex,
        "role": "assistant",
        "content": result.response,
        "timestamp": now,
        "metadata": result_payload,
    }

    if payload.conversation_id:
        conversation_id = _to_object_id(payload.conversation_id)
        update = await db.conversations.update_one(
            {"_id": conversation_id, "user_id": user_id},
            {
                "$push": {"messages": {"$each": [user_message, assistant_message]}},
                "$set": {"updated_at": now},
            },
        )
        if update.matched_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    else:
        insert = await db.conversations.insert_one(
            {
                "user_id": user_id,
                "messages": [user_message, assistant_message],
                "created_at": now,
                "updated_at": now,
            }
        )
        conversation_id = insert.inserted_id

    return {
        "conversation_id": str(conversation_id),
        "message": assistant_message,
        "response": result.response,
        "processing_type": result_payload["processing_type"],
        "confidence": result.confidence,
        "sources": result.sources,
        "is_crisis": result.is_crisis,
        "crisis_message": result.crisis_message,
        "metadata": result.metadata,
    }


@router.get("/history")
async def get_chat_history(
    request: Request,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db=Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    user_id = _resolve_user_id(request, x_user_id)
    skip = (page - 1) * limit
    query = {"user_id": user_id}
    total = await db.conversations.count_documents(query)
    cursor = db.conversations.find(query).sort("updated_at", -1).skip(skip).limit(limit)
    conversations = [_serialize_conversation(item) async for item in cursor]
    return {
        "page": page,
        "limit": limit,
        "total": total,
        "conversations": conversations,
    }


@router.get("/{conversation_id}")
async def get_chat_conversation(
    conversation_id: str,
    request: Request,
    db=Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    user_id = _resolve_user_id(request, x_user_id)
    conversation = await db.conversations.find_one({"_id": _to_object_id(conversation_id), "user_id": user_id})
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return _serialize_conversation(conversation)


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat_conversation(
    conversation_id: str,
    request: Request,
    db=Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    user_id = _resolve_user_id(request, x_user_id)
    delete = await db.conversations.delete_one({"_id": _to_object_id(conversation_id), "user_id": user_id})
    if delete.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return None


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


def _to_object_id(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid conversation id")


def _serialize_conversation(conversation: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(conversation["_id"]),
        "user_id": conversation["user_id"],
        "messages": [_serialize_message(message) for message in conversation.get("messages", [])],
        "created_at": _serialize_datetime(conversation.get("created_at")),
        "updated_at": _serialize_datetime(conversation.get("updated_at")),
    }


def _serialize_message(message: dict[str, Any]) -> dict[str, Any]:
    return {
        **message,
        "timestamp": _serialize_datetime(message.get("timestamp")),
    }


def _serialize_datetime(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    return value


def _serialize_disigen_result(result: Any) -> dict[str, Any]:
    if hasattr(result, "model_dump"):
        payload = result.model_dump(mode="json")
    else:
        payload = result.dict()
    processing_type = payload.get("processing_type")
    payload["processing_type"] = getattr(processing_type, "value", processing_type)
    return payload
