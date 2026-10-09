from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorClient

from backend.app.utils.security import get_password_hash, verify_password
from backend.config import LOGGER, MONGO_URI, cfg

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


async def ensure_test_user(mongo_uri: str | None = None, database_name: str = "reassureai") -> bool:
    """Create or repair the local test account. Returns True when a write occurred."""
    uri = mongo_uri or MONGO_URI
    client = AsyncIOMotorClient(uri)
    try:
        db = client[database_name]
        email = cfg.TEST_USER_EMAIL.strip().lower()
        password = cfg.TEST_USER_PASSWORD
        desired = {
            "email": email,
            "hashed_password": get_password_hash(password),
            "full_name": cfg.TEST_USER_FULL_NAME,
            "guardian_email": cfg.TEST_USER_GUARDIAN_EMAIL,
            "is_active": True,
        }

        existing = await db.users.find_one({"email": email})
        if not existing:
            desired["created_at"] = __import__("datetime").datetime.utcnow()
            await db.users.insert_one(desired)
            LOGGER.info("Created local test user %s", email)
            return True

        needs_update = (
            not verify_password(password, existing.get("hashed_password", ""))
            or existing.get("full_name") != desired["full_name"]
            or existing.get("guardian_email") != desired["guardian_email"]
            or existing.get("is_active") is not True
        )
        if needs_update:
            await db.users.update_one(
                {"_id": existing["_id"]},
                {
                    "$set": {
                        "hashed_password": desired["hashed_password"],
                        "full_name": desired["full_name"],
                        "guardian_email": desired["guardian_email"],
                        "is_active": True,
                    }
                },
            )
            LOGGER.info("Repaired local test user %s", email)
            return True
        return False
    finally:
        client.close()
