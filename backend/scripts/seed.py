import asyncio
from backend.app.db.connection import get_db
from backend.app.db.models.user import User
from backend.app.utils.security import get_password_hash

async def main():
    db = await get_db()
    # Ensure indexes
    await User.ensure_indexes()
    # Create test user if not exists
    existing = await User.find_one(User.email == "test@reassureai.dev")
    if not existing:
        user = User(
            email="test@reassureai.dev",
            hashed_password=get_password_hash("Test@1234!"),
        )
        await user.insert()
        print("Test user created")
    else:
        print("Test user already exists")

if __name__ == "__main__":
    asyncio.run(main())
