from beanie import Document, Indexed
from pydantic import BaseModel, Field
from datetime import datetime

class Report(Document):
    user_id: Indexed(str)
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "reports"
