import os
from datetime import datetime, timedelta
from jose import JWTError, jwt

SECRET = os.environ.get("JWT_SECRET", "habit-dev-secret-change-in-production")
EXPIRES_DAYS = 7


def sign_token(payload: dict) -> str:
    to_encode = payload.copy()
    expire = datetime.utcnow() + timedelta(days=EXPIRES_DAYS)
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET, algorithm="HS256")


def verify_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, SECRET, algorithms=["HS256"])
    except JWTError:
        return None
