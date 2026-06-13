from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_settings import BaseSettings

class DBSettings(BaseSettings):
    MONGO_URI: str = "mongodb://localhost:27017/reassureai"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

async def get_client() -> AsyncIOMotorClient:
    settings = DBSettings()
    return AsyncIOMotorClient(settings.MONGO_URI)

async def get_db():
    client = await get_client()
    return client.reassureai
