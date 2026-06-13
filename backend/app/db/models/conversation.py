from beanie import Document, Indexed
from pydantic import BaseModel, Field
from datetime import datetime

class Conversation(Document):
    user_id: Indexed(str)
    messages: list[dict]
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "conversations"

class Report(Document):
    user_id: Indexed(str)
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "reports"

class Feedback(Document):
    user_id: Indexed(str)
    conversation_id: str
    score: int
    comment: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "feedback"
