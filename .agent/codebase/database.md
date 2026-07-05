# ReassureAI — Database (MongoDB)

> **Updated every time schema changes.**
> MongoDB on Windows — accessed from WSL2. See wsl_setup.md for connection.

---

## Connection

```python
# db/connection.py
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

_client = None

def get_db():
    global _client
    if _client is None:
        # Windows host IP — not localhost (see wsl_setup.md)
        _client = AsyncIOMotorClient(settings.mongodb_uri)
    return _client["reassureai"]
```

`.env` example:

```
# Get Windows IP: run `cat /etc/resolv.conf` in WSL2, use the nameserver IP
MONGODB_URI=mongodb://192.168.x.x:27017/reassureai
```

---

## Collections

### users

```json
{
  "_id": "ObjectId",
  "full_name": "string",
  "email": "string (unique, indexed, lowercase)",
  "guardian_email": "string",
  "password_hash": "string (bcrypt rounds=12)",
  "is_test_user": "boolean (default false)",
  "created_at": "datetime",
  "last_login": "datetime",
  "is_active": "boolean"
}
```

### conversations

```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref: users)",
  "title": "string (auto from first 50 chars of first message)",
  "branch": "mental_health | physical_health | report",
  "messages": [
    {
      "id": "string (uuid)",
      "role": "user | assistant",
      "content": "string (markdown)",
      "timestamp": "datetime",
      "metadata": {
        "branch": "mental_health | physical_health | report",
        "route_used": "MENTAL_HEALTH | DUAL_PARALLEL | MODERN_HEAVY | AYUR_HEAVY | MODERN_ONLY",
        "chains_called": ["chain1", "chain2", "chain3"],
        "chain_results": {
          "chain1": "OpenBioLLM response or null",
          "chain2": "AyurParam response or null",
          "chain3": "Mistral response or null"
        },
        "chain2_confidence": "float 0.0-1.0 (AyurParam confidence score)",
        "rag_retrieved": "boolean",
        "crisis_detected": "boolean",
        "api_used": "huggingface | groq (for chain1 failover tracking)"
      }
    }
  ],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

> **Why `branch` not `mode`?** The UI has "Mental Health" and "Physical Health" branches,
> not abstract "modes". Report simplification is a sub-feature of Physical Health branch.
> This naming matches the architecture diagram.

> **Why all 3 chains in `chains_called`?** Mental health only uses chain3.
> Physical health uses all 3 concurrently. Report uses chain1 primarily.
> Storing which chains were called enables debugging and future analytics.

> **`chain2_confidence`** — AyurParam's self-reported confidence (0.0-1.0).
> SEC2 uses this to decide how prominently to feature the Ayurvedic perspective.

---

### reports

```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref: users)",
  "original_filename": "string",
  "file_type": "pdf | image",
  "file_hash": "string (SHA-256 — for deduplication, indexed)",
  "document_id": "ObjectId (ref: documents)",
  "extracted_text": "string (raw OCR/extracted text)",
  "simplified_report": "string (markdown — Chain 1 output)",
  "created_at": "datetime"
}
```

### documents

```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref: users)",
  "original_filename": "string",
  "stored_filename": "string",
  "stored_path": "string",
  "content_type": "string",
  "file_size": "number",
  "file_hash": "string (SHA-256 — for deduplication, indexed)",
  "upload_date": "datetime",
  "status": "uploaded | processed | failed",
  "extracted_text_path": "string | null"
}
```

### feedback

```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref: users)",
  "conversation_id": "ObjectId (ref: conversations)",
  "message_id": "string (uuid matching message.id)",
  "feedback": "like | dislike",
  "comment": "string | null",
  "chains_used": ["chain1", "chain2", "chain3"],
  "branch": "mental_health | physical_health | report",
  "created_at": "datetime"
}
```

### test_users (seed data)

```json
{
  "email": "test@reassureai.dev",
  "password": "Test@1234!",
  "full_name": "Test User",
  "guardian_email": "guardian@reassureai.dev",
  "is_test_user": true
}
```

---

## Indexes

```python
async def create_indexes(db):
    await db.users.create_index("email", unique=True)
    await db.conversations.create_index("user_id")
    await db.conversations.create_index("updated_at")
    await db.reports.create_index([("user_id", 1), ("file_hash", 1)])
    await db.feedback.create_index("conversation_id")
    await db.feedback.create_index("user_id")
```

Call once in FastAPI lifespan startup event.

---

## Seed Script (Test User)

```python
# scripts/seed.py — run once after DB setup
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
from datetime import datetime

async def seed():
    client = AsyncIOMotorClient("mongodb://192.168.x.x:27017")
    db = client["reassureai"]

    test_user = {
        "full_name": "Test User",
        "email": "test@reassureai.dev",
        "guardian_email": "guardian@reassureai.dev",
        "password_hash": bcrypt.hashpw(b"Test@1234!", bcrypt.gensalt(12)).decode(),
        "is_test_user": True,
        "created_at": datetime.utcnow(),
        "last_login": None,
        "is_active": True
    }

    existing = await db.users.find_one({"email": "test@reassureai.dev"})
    if not existing:
        await db.users.insert_one(test_user)
        print("✓ Test user created: test@reassureai.dev / Test@1234!")
    else:
        print("ℹ Test user already exists")

asyncio.run(seed())
```

Run: `python scripts/seed.py`

---

## ObjectId Serialization

Always convert \_id to string before returning from API:

```python
def serialize_doc(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc
```

Or use Pydantic with `model_config = ConfigDict(from_attributes=True)`.

---

## What Agent Updates Here

Add new collections, schema changes, or new indexes here immediately.
