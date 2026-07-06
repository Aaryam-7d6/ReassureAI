import asyncio
from backend.app.db.connection import get_client
from backend.app.db.init import ensure_required_collections
from backend.app.utils.security import get_password_hash

async def main():
    client = await get_client()
    try:
        db = client.reassureai
        await ensure_required_collections()
        existing = await db.users.find_one({"email": "test@reassureai.dev"})
        if not existing:
            await db.users.insert_one(
                {
                    "email": "test@reassureai.dev",
                    "hashed_password": get_password_hash("Test@1234!"),
                    "full_name": "Test User",
                    "guardian_email": "guardian@reassureai.dev",
                    "is_active": True,
                    "created_at": __import__("datetime").datetime.utcnow(),
                }
            )
            print("Test user created")
        else:
            print("Test user already exists")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())
