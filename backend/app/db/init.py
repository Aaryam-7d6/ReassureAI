from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorClient

from backend.config import LOGGER, MONGO_URI

REQUIRED_COLLECTIONS = ["users", "conversations", "reports", "feedback", "documents"]


async def ensure_required_collections(mongo_uri: str | None = None, database_name: str = "reassureai") -> list[str]:
    """Create any missing application collections and return the names created."""
    uri = mongo_uri or MONGO_URI
    client = AsyncIOMotorClient(uri)
    try:
        db = client[database_name]
        existing = set(await db.list_collection_names())
        created: list[str] = []
        for collection_name in REQUIRED_COLLECTIONS:
            if collection_name not in existing:
                await db.create_collection(collection_name)
                created.append(collection_name)
                LOGGER.info("Created MongoDB collection %s", collection_name)
        return created
    finally:
        client.close()


async def verify_required_collections(mongo_uri: str | None = None, database_name: str = "reassureai") -> dict[str, bool]:
    """Return the presence state of the required collections."""
    uri = mongo_uri or MONGO_URI
    client = AsyncIOMotorClient(uri)
    try:
        db = client[database_name]
        existing = set(await db.list_collection_names())
        return {name: name in existing for name in REQUIRED_COLLECTIONS}
    finally:
        client.close()
