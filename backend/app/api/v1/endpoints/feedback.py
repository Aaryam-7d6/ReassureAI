from __future__ import annotations

from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel

from backend.app.api.v1.endpoints.chat import _resolve_user_id
from backend.app.db.connection import get_db


router = APIRouter(prefix="/feedback", tags=["feedback"])


class FeedbackRequest(BaseModel):
    message_id: str
    vote: Literal["like", "dislike"]


@router.post("")
async def submit_feedback(
    payload: FeedbackRequest,
    request: Request,
    db=Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    user_id = _resolve_user_id(request, x_user_id)
    message_id = payload.message_id.strip()
    if not message_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="message_id cannot be empty")

    conversation = await db.conversations.find_one({"messages.id": message_id})
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    if conversation.get("user_id") != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Message belongs to a different user")

    feedback = {
        "user_id": user_id,
        "vote": payload.vote,
        "updated_at": datetime.utcnow(),
    }
    update = await db.conversations.update_one(
        {"_id": conversation["_id"], "user_id": user_id, "messages.id": message_id},
        {"$set": {"messages.$.feedback": feedback, "updated_at": feedback["updated_at"]}},
    )
    if update.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    return {
        "message_id": message_id,
        "vote": payload.vote,
        "conversation_id": str(conversation["_id"]),
        "feedback": {
            **feedback,
            "updated_at": feedback["updated_at"].isoformat(),
        },
        "message": "Feedback saved",
    }
