import re
from fastapi import HTTPException, status

PASSWORD_REGEX = re.compile(
    r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':\\|,.<>/?]).{8,}$"
)

def validate_password(pw: str):
    if not PASSWORD_REGEX.match(pw):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters, include upper and lower case letters, a number, and a special character.",
        )
    return pw

def validate_email_format(email: str):
    # Pydantic already validates EmailStr, but extra check for domain
    if "@" not in email or email.startswith("@"):  # simplistic
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format.",
        )
    return email
