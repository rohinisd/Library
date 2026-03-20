import logging
import secrets
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse

from auth_jwt import sign_token, verify_token
from config import settings
from dependencies import get_current_user, get_db_pool, db_error_to_http
from schemas import AuthResponse, LoginBody, RegisterBody
from auth_bcrypt import hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])
log = logging.getLogger(__name__)


@router.post("/register", response_model=AuthResponse)
async def register(body: RegisterBody, pool=Depends(get_db_pool)):
    try:
        password_hash = None
        if body.password:
            password_hash = hash_password(body.password)
        row = await pool.fetchrow(
            """INSERT INTO users (username, password_hash, display_name)
               VALUES ($1, $2, $3)
               RETURNING id, username, display_name""",
            body.username,
            password_hash,
            body.displayName or body.username,
        )
        payload = {
            "userId": str(row["id"]),
            "username": row["username"],
            "displayName": row["display_name"] or row["username"],
        }
        token = sign_token(payload)
        return AuthResponse(ok=True, token=token)
    except HTTPException:
        raise
    except Exception as e:
        log.exception("register failed: %s", e)
        raise db_error_to_http(e)


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginBody, pool=Depends(get_db_pool)):
    try:
        row = await pool.fetchrow(
            "SELECT id, username, display_name, password_hash FROM users WHERE username = $1",
            body.username,
        )
        if not row:
            raise HTTPException(status_code=401, detail="Wrong username or password")
        if row["password_hash"]:
            if not verify_password(body.password, row["password_hash"]):
                raise HTTPException(status_code=401, detail="Wrong username or password")
        payload = {
            "userId": str(row["id"]),
            "username": row["username"],
            "displayName": row["display_name"] or row["username"],
        }
        token = sign_token(payload)
        return AuthResponse(ok=True, token=token)
    except HTTPException:
        raise
    except Exception as e:
        log.exception("login failed: %s", e)
        raise db_error_to_http(e)


@router.post("/logout")
async def logout():
    return {"ok": True}


@router.get("/google")
async def google_start():
    if not settings.google_client_id:
        raise HTTPException(status_code=503, detail="Google OAuth not configured")
    state = secrets.token_urlsafe(32)
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": _google_redirect_uri(),
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "consent",
    }
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return RedirectResponse(url=url)


@router.get("/google/callback")
async def google_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    pool=Depends(get_db_pool),
):
    if error:
        frontend = (settings.frontend_url or "http://localhost:3000").rstrip("/")
        return RedirectResponse(url=f"{frontend}/login?error={error}")
    if not code:
        raise HTTPException(status_code=400, detail="Missing code")
    async with httpx.AsyncClient() as client:
        r = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": _google_redirect_uri(),
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
    if r.status_code != 200:
        raise HTTPException(status_code=400, detail="OAuth token exchange failed")
    data = r.json()
    access_token = data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="No access token")
    async with httpx.AsyncClient() as client:
        user_r = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
    if user_r.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to get user info")
    user_info = user_r.json()
    google_id = user_info.get("id")
    email = user_info.get("email", "")
    name = user_info.get("name") or user_info.get("email", "User")
    row = await pool.fetchrow(
        "SELECT id, username, display_name FROM users WHERE google_id = $1",
        google_id,
    )
    if not row:
        username = (email or google_id or "user")[:64]
        existing = await pool.fetchrow("SELECT id FROM users WHERE username = $1", username)
        if existing:
            username = f"{username}_{google_id[:8]}"
        await pool.execute(
            """INSERT INTO users (username, display_name, google_id, email)
               VALUES ($1, $2, $3, $4)""",
            username,
            name,
            google_id,
            email or None,
        )
        row = await pool.fetchrow(
            "SELECT id, username, display_name FROM users WHERE google_id = $1",
            google_id,
        )
    payload = {
        "userId": str(row["id"]),
        "username": row["username"],
        "displayName": row["display_name"] or row["username"],
    }
    token = sign_token(payload)
    frontend = (settings.frontend_url or "http://localhost:3000").rstrip("/")
    return RedirectResponse(url=f"{frontend}/api/auth/oauth-callback?token={token}")


def _google_redirect_uri() -> str:
    import os
    base = os.environ.get("RENDER_EXTERNAL_URL") or "http://localhost:10000"
    return f"{base.rstrip('/')}/api/auth/google/callback"
