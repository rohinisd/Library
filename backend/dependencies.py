import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from auth_jwt import verify_token
from database import get_pool

log = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)


async def get_db_pool():
    """FastAPI dependency: get DB pool or raise 503. Use in routes that need DB."""
    try:
        return await get_pool()
    except RuntimeError as e:
        if "DATABASE_URL" in str(e):
            raise HTTPException(status_code=503, detail="Database not configured. Set DATABASE_URL on the backend.")
        raise HTTPException(status_code=503, detail="Database unavailable.")
    except Exception as e:
        log.exception("get_db_pool: %s", e)
        raise HTTPException(status_code=503, detail="Database unavailable. Try again later.")


def db_error_to_http(e: Exception) -> HTTPException:
    """Convert DB/schema errors to HTTPException for FastAPI to return."""
    err = str(e).lower()
    if "72" in err and "bytes" in err and "password" in err:
        return HTTPException(
            status_code=400,
            detail="Password is too long for bcrypt (max 72 UTF-8 bytes).",
        )
    if "unique" in err or "duplicate" in err:
        return HTTPException(status_code=400, detail="Username already taken")
    if "relation" in err and "does not exist" in err:
        return HTTPException(status_code=503, detail="Database schema not set up. Run migrations (see README).")
    if "column" in err and "does not exist" in err:
        return HTTPException(status_code=503, detail="Database schema mismatch. Run migrations.")
    msg = str(e).split("\n")[0].strip()[:120] or "Operation failed. Try again later."
    return HTTPException(status_code=503, detail=msg)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = credentials.credentials
    if credentials.scheme != "Bearer":
        raise HTTPException(status_code=401, detail="Invalid authentication scheme")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload
