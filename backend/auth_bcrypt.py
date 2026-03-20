"""
Password hashing with pyca/bcrypt directly (not passlib).

pyca/bcrypt raises ValueError if the password is longer than 72 bytes.
We always pass raw UTF-8 bytes truncated to exactly <= 72 bytes — never a string
that could re-encode to more than 72 bytes after passlib or other wrappers.
"""

from __future__ import annotations

import bcrypt

BCRYPT_MAX_BYTES = 72


def password_bytes(password: str | bytes | None) -> bytes:
    """First 72 UTF-8 bytes of the password (bcrypt hard limit)."""
    if password is None:
        return b""
    if isinstance(password, bytes):
        b = password
    else:
        b = str(password).encode("utf-8")
    return b[:BCRYPT_MAX_BYTES]


def hash_password(password: str | bytes | None) -> str:
    """Return bcrypt hash string ($2b$...) for storage."""
    pwd = password_bytes(password)
    return bcrypt.hashpw(pwd, bcrypt.gensalt()).decode("ascii")


def verify_password(password: str | bytes | None, password_hash: str) -> bool:
    """Verify password against stored bcrypt hash."""
    if not password_hash:
        return False
    pwd = password_bytes(password)
    try:
        return bcrypt.checkpw(pwd, password_hash.encode("ascii"))
    except ValueError:
        return False
