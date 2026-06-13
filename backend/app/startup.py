import os
import httpx
from motor.motor_asyncio import AsyncIOMotorClient
from ..config import settings

async def check_ollama() -> None:
    """Verify Ollama service is reachable."""
    url = f"{settings.OLLAMA_BASE_URL}/api/version"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, timeout=2)
            resp.raise_for_status()
        except Exception as exc:
            raise RuntimeError("Ollama service unreachable") from exc

async def check_mongodb() -> None:
    """Verify MongoDB connection can be established."""
    mongo_uri = settings.MONGO_URI
    if not mongo_uri:
        raise RuntimeError("MONGO_URI not configured")
    client = AsyncIOMotorClient(mongo_uri)
    try:
        await client.admin.command("ping")
    finally:
        client.close()
