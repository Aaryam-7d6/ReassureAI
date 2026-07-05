from beanie import Document, Indexed
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime

class User(Document):
    email: Indexed(str, unique=True)
    hashed_password: str
    full_name: str | None = None
    guardian_email: str | None = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"

    class Config:
        schema_extra = {
            "example": {
                "email": "test@reassureai.dev",
                "hashed_password": "$2b$12$...",
                "full_name": "Test User",
            }
        }
