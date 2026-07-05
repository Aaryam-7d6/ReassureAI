from __future__ import annotations

from datetime import datetime

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel

from backend.app.db.connection import get_db
from backend.app.utils.security import create_access_token, get_password_hash, verify_password
from backend.app.utils.validators import validate_email_format, validate_password


router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_NAME = "access_token"


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str | None = None
    guardian_email: str | None = None


class LoginRequest(BaseModel):
    email: str | None = None
    password: str | None = None


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, response: Response, db=Depends(get_db)):
    email = payload.email.strip().lower()
    validate_email_format(email)
    validate_password(payload.password)

    existing = await db.users.find_one({"email": email})
    if existing:
        if verify_password(payload.password, existing.get("hashed_password", "")):
            token = create_access_token({"sub": str(existing["_id"])})
            _set_auth_cookie(response, token)
            serialized_user = _serialize_user(existing)
            return {
                "user": serialized_user,
                "email": serialized_user["email"],
                "full_name": serialized_user["full_name"],
                "access_token": token,
                "token_type": "bearer",
            }
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"email": "Email already registered"})

    guardian_email = payload.guardian_email.strip() if payload.guardian_email else None
    user = {
        "email": email,
        "hashed_password": get_password_hash(payload.password),
        "full_name": payload.full_name.strip() if payload.full_name else None,
        "guardian_email": guardian_email,
        "is_active": True,
        "created_at": datetime.utcnow(),
    }
    insert = await db.users.insert_one(user)
    user["_id"] = insert.inserted_id

    token = create_access_token({"sub": str(insert.inserted_id)})
    _set_auth_cookie(response, token)
    serialized_user = _serialize_user(user)
    return {
        "user": serialized_user,
        "email": serialized_user["email"],
        "full_name": serialized_user["full_name"],
        "access_token": token,
        "token_type": "bearer",
    }


@router.post("/login")
async def login(request: Request, response: Response, db=Depends(get_db)):
    payload = await _parse_login_payload(request)
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    if not email or not password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"password": "Email and password are required"})

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(password, user.get("hashed_password", "")):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"password": "Incorrect email or password"})

    token = create_access_token({"sub": str(user["_id"])})
    _set_auth_cookie(response, token)
    serialized_user = _serialize_user(user)
    return {
        "user": serialized_user,
        "email": serialized_user["email"],
        "full_name": serialized_user["full_name"],
        "access_token": token,
        "token_type": "bearer",
    }


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(COOKIE_NAME, path="/", samesite="lax")
    return {"message": "Logged out"}


@router.get("/me")
async def me(request: Request, db=Depends(get_db)):
    user_id = _user_id_from_request(request)
    user = await db.users.find_one({"_id": _to_object_id(user_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return {"user": _serialize_user(user)}


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        COOKIE_NAME,
        token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=60 * 60 * 24 * 7,
    )


async def _parse_login_payload(request: Request) -> dict:
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        return await request.json()
    form = await request.form()
    return {"email": form.get("email") or form.get("username"), "password": form.get("password")}


def _user_id_from_request(request: Request) -> str:
    token = request.cookies.get(COOKIE_NAME)
    authorization = request.headers.get("Authorization")
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1]
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    try:
        import jwt
        from backend import config

        payload = jwt.decode(token, config.cfg.JWT_SECRET, algorithms=[config.cfg.JWT_ALGORITHM])
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    subject = payload.get("sub")
    if not subject:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return str(subject)


def _to_object_id(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")


def _serialize_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "email": user.get("email"),
        "full_name": user.get("full_name"),
        "name": user.get("full_name"),
        "guardian_email": user.get("guardian_email"),
        "is_active": user.get("is_active", True),
    }
