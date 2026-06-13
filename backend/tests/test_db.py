import pytest
import asyncio
from backend.app.db.connection import get_client

@pytest.mark.asyncio
async def test_mongo_connection():
    client = await get_client()
    db = client.test_db
    await db.run_command({"ping": 1})
    assert True
