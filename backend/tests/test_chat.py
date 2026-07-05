from __future__ import annotations

from datetime import datetime
from types import SimpleNamespace

from bson import ObjectId
from fastapi.testclient import TestClient

from backend.app.api.v1.endpoints import chat
from backend.app.core.pipeline.disigen import DisigenResult, ProcessingType
from backend.app.db.connection import get_db
from backend.main import app


def test_chat_full_query_to_response_is_saved(monkeypatch):
    fake_db = FakeDb()

    class FakeDisigenNode:
        async def process_query(self, query, user_id=None, guardian_email=None, file_content=None):
            assert query == "I feel anxious about exams"
            assert user_id == "user-123"
            return DisigenResult(
                processing_type=ProcessingType.MENTAL_HEALTH,
                response="Try one grounding exercise and take a short break.",
                confidence=0.88,
                sources=["semantic_gate", "mistral"],
                metadata={"distress_level": 3},
            )

    monkeypatch.setattr(chat, "DisigenNode", FakeDisigenNode)
    app.dependency_overrides[get_db] = lambda: fake_db

    try:
        client = TestClient(app)
        response = client.post(
            "/api/v1/chat",
            json={"query": "I feel anxious about exams"},
            headers={"X-User-Id": "user-123"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert body["response"] == "Try one grounding exercise and take a short break."
    assert body["processing_type"] == "mental_health"
    assert body["conversation_id"] == str(fake_db.conversations.inserted_id)

    saved = fake_db.conversations.documents[0]
    assert saved["user_id"] == "user-123"
    assert saved["messages"][0]["id"]
    assert saved["messages"][0]["role"] == "user"
    assert saved["messages"][0]["content"] == "I feel anxious about exams"
    assert saved["messages"][1]["id"]
    assert saved["messages"][1]["role"] == "assistant"
    assert saved["messages"][1]["content"] == "Try one grounding exercise and take a short break."
    assert saved["messages"][1]["metadata"]["confidence"] == 0.88


def test_chat_history_detail_and_delete(monkeypatch):
    conversation_id = ObjectId()
    fake_db = FakeDb(
        initial_documents=[
            {
                "_id": conversation_id,
                "user_id": "user-123",
                "messages": [
                    {"role": "user", "content": "hello", "timestamp": datetime.utcnow()},
                    {"role": "assistant", "content": "hi", "timestamp": datetime.utcnow()},
                ],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
        ]
    )
    app.dependency_overrides[get_db] = lambda: fake_db

    try:
        client = TestClient(app)
        history = client.get("/api/v1/chat/history", headers={"X-User-Id": "user-123"})
        detail = client.get(f"/api/v1/chat/{conversation_id}", headers={"X-User-Id": "user-123"})
        deleted = client.delete(f"/api/v1/chat/{conversation_id}", headers={"X-User-Id": "user-123"})
    finally:
        app.dependency_overrides.clear()

    assert history.status_code == 200
    assert history.json()["total"] == 1
    assert history.json()["conversations"][0]["id"] == str(conversation_id)
    assert detail.status_code == 200
    assert detail.json()["messages"][1]["content"] == "hi"
    assert deleted.status_code == 204
    assert fake_db.conversations.documents == []


class FakeDb:
    def __init__(self, initial_documents=None):
        self.conversations = FakeConversations(initial_documents or [])


class FakeConversations:
    def __init__(self, documents):
        self.documents = list(documents)
        self.inserted_id = ObjectId()

    async def insert_one(self, document):
        document = {**document, "_id": self.inserted_id}
        self.documents.append(document)
        return SimpleNamespace(inserted_id=self.inserted_id)

    async def update_one(self, query, update):
        for document in self.documents:
            if document["_id"] == query["_id"] and document["user_id"] == query["user_id"]:
                document["messages"].extend(update["$push"]["messages"]["$each"])
                document.update(update.get("$set", {}))
                return SimpleNamespace(matched_count=1)
        return SimpleNamespace(matched_count=0)

    async def count_documents(self, query):
        return len(_matching(self.documents, query))

    def find(self, query):
        return FakeCursor(_matching(self.documents, query))

    async def find_one(self, query):
        matches = _matching(self.documents, query)
        return matches[0] if matches else None

    async def delete_one(self, query):
        before = len(self.documents)
        self.documents = [
            document
            for document in self.documents
            if not (document["_id"] == query["_id"] and document["user_id"] == query["user_id"])
        ]
        return SimpleNamespace(deleted_count=before - len(self.documents))


class FakeCursor:
    def __init__(self, documents):
        self.documents = list(documents)

    def sort(self, key, direction):
        reverse = direction < 0
        self.documents.sort(key=lambda document: document.get(key) or datetime.min, reverse=reverse)
        return self

    def skip(self, count):
        self.documents = self.documents[count:]
        return self

    def limit(self, count):
        self.documents = self.documents[:count]
        return self

    def __aiter__(self):
        self._index = 0
        return self

    async def __anext__(self):
        if self._index >= len(self.documents):
            raise StopAsyncIteration
        item = self.documents[self._index]
        self._index += 1
        return item


def _matching(documents, query):
    return [
        document
        for document in documents
        if all(document.get(key) == value for key, value in query.items())
    ]
