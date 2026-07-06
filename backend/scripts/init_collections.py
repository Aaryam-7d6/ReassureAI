import asyncio
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from backend.app.db.init import ensure_required_collections, verify_required_collections


async def main() -> None:
    mongo_uri = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI") or "mongodb://host.docker.internal:27017/reassureai"
    created = await ensure_required_collections(mongo_uri)
    verified = await verify_required_collections(mongo_uri)

    print(f"Mongo URI: {mongo_uri}")
    print(f"Created collections: {created if created else 'none'}")
    for name, present in verified.items():
        print(f"- {name}: {'present' if present else 'missing'}")

    if any(not present for present in verified.values()):
        print("Collection verification failed")
        sys.exit(1)

    print("Collection verification succeeded")


if __name__ == "__main__":
    asyncio.run(main())
