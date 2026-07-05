from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_settings import BaseSettings

class DBSettings(BaseSettings):
    MONGO_URI: str = "mongodb://localhost:27017/reassureai"
    MONGODB_URI: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

async def get_client() -> AsyncIOMotorClient:
    settings = DBSettings()
    return AsyncIOMotorClient(settings.MONGODB_URI or settings.MONGO_URI)

async def get_db():
    client = await get_client()
    return client.reassureai
