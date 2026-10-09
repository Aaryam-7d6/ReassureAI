import asyncio
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app.db.connection import get_client
from backend.app.db.init import ensure_required_collections, ensure_test_user

async def main():
    client = await get_client()
    try:
        await ensure_required_collections()
        changed = await ensure_test_user()
        print("Test user created/repaired" if changed else "Test user already valid")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())
