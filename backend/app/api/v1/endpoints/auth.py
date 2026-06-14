from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from backend.app.db.models.user import User
from backend.app.schemas.auth import UserCreate, UserOut, Token
from backend.app.utils.security import get_password_hash, verify_password, create_access_token
from backend.app.utils.validators import validate_password, validate_email_format
from beanie import PydanticObjectId

router = APIRouter()

@router.post("/register", response_model=UserOut)
async def register(user: UserCreate):
    validate_email_format(user.email)
    validate_password(user.password)
    existing = await User.find_one(User.email == user.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = get_password_hash(user.password)
    db_user = User(email=user.email, hashed_password=hashed, full_name=user.full_name)
    await db_user.insert()
    return UserOut(
        id=str(db_user.id),
        email=db_user.email,
        full_name=db_user.full_name,
        is_active=db_user.is_active,
    )

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await User.find_one(User.email == form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    access_token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=access_token)

@router.post("/logout")
async def logout():
    # client clears cookie on frontend; placeholder
    return {"msg": "Logged out"}

@router.get("/me", response_model=UserOut)
async def read_me(current_user: User = Depends(...)):
    # Dependency to get current_user from token should be implemented elsewhere
    return UserOut(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
    )
