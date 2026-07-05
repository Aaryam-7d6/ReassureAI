from __future__ import annotations

from datetime import datetime
from types import SimpleNamespace

from bson import ObjectId
from fastapi.testclient import TestClient

from backend.app.db.connection import get_db
from backend.main import app


def test_valid_feedback_vote_is_embedded_on_message():
    fake_db = FakeDb(
        [
            {
                "_id": ObjectId(),
                "user_id": "user-123",
                "messages": [
                    {"id": "msg-1", "role": "assistant", "content": "hello", "timestamp": datetime.utcnow()}
                ],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
        ]
    )
    app.dependency_overrides[get_db] = lambda: fake_db

    try:
        response = TestClient(app).post(
            "/api/v1/feedback",
            json={"message_id": "msg-1", "vote": "like"},
            headers={"X-User-Id": "user-123"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["message_id"] == "msg-1"
    assert response.json()["vote"] == "like"
    stored = fake_db.conversations.documents[0]["messages"][0]["feedback"]
    assert stored["user_id"] == "user-123"
    assert stored["vote"] == "like"


def test_feedback_invalid_message_id_returns_404():
    fake_db = FakeDb([])
    app.dependency_overrides[get_db] = lambda: fake_db

    try:
        response = TestClient(app).post(
            "/api/v1/feedback",
            json={"message_id": "missing", "vote": "like"},
            headers={"X-User-Id": "user-123"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 404


def test_feedback_for_someone_elses_message_returns_403():
    fake_db = FakeDb(
        [
            {
                "_id": ObjectId(),
                "user_id": "owner-456",
                "messages": [
                    {"id": "msg-2", "role": "assistant", "content": "private", "timestamp": datetime.utcnow()}
                ],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
        ]
    )
    app.dependency_overrides[get_db] = lambda: fake_db

    try:
        response = TestClient(app).post(
            "/api/v1/feedback",
            json={"message_id": "msg-2", "vote": "dislike"},
            headers={"X-User-Id": "user-123"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 403
    assert "feedback" not in fake_db.conversations.documents[0]["messages"][0]


def test_double_vote_overwrites_previous_vote():
    fake_db = FakeDb(
        [
            {
                "_id": ObjectId(),
                "user_id": "user-123",
                "messages": [
                    {
                        "id": "msg-3",
                        "role": "assistant",
                        "content": "hello",
                        "timestamp": datetime.utcnow(),
                        "feedback": {"user_id": "user-123", "vote": "like", "updated_at": datetime.utcnow()},
                    }
                ],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
        ]
    )
    app.dependency_overrides[get_db] = lambda: fake_db

    try:
        response = TestClient(app).post(
            "/api/v1/feedback",
            json={"message_id": "msg-3", "vote": "dislike"},
            headers={"X-User-Id": "user-123"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["vote"] == "dislike"
    assert fake_db.conversations.documents[0]["messages"][0]["feedback"]["vote"] == "dislike"


class FakeDb:
    def __init__(self, documents):
        self.conversations = FakeConversations(documents)


class FakeConversations:
    def __init__(self, documents):
        self.documents = list(documents)

    async def find_one(self, query):
        message_id = query.get("messages.id")
        for document in self.documents:
            if message_id and any(message.get("id") == message_id for message in document.get("messages", [])):
                return document
        return None

    async def update_one(self, query, update):
        for document in self.documents:
            if document["_id"] != query["_id"] or document["user_id"] != query["user_id"]:
                continue
            for message in document.get("messages", []):
                if message.get("id") == query["messages.id"]:
                    message["feedback"] = update["$set"]["messages.$.feedback"]
                    document["updated_at"] = update["$set"]["updated_at"]
                    return SimpleNamespace(matched_count=1)
        return SimpleNamespace(matched_count=0)
