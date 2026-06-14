import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

@pytest.fixture
def register_user():
    res = client.post("/api/v1/auth/register", json={"email":"a@b.c","password":"Test@1234!"})
    return res.json()

def test_register_user(register_user):
    assert register_user["email"] == "a@b.c"

def test_login(register_user):
    res = client.post("/api/v1/auth/login", data={"username":"a@b.c","password":"Test@1234!"})
    assert res.status_code == 200
    assert "access_token" in res.json()

def test_invalid_email():
    res = client.post("/api/v1/auth/register", json={"email":"invalid","password":"Test@1234!"})
    assert res.status_code == 400
