"""Run at Docker build: fail if bcrypt rejects long passwords (must stay in sync with auth_bcrypt)."""

import sys

sys.path.insert(0, ".")

from auth_bcrypt import hash_password, verify_password  # noqa: E402


def main() -> None:
    long_pw = "x" * 500
    h = hash_password(long_pw)
    assert h.startswith("$2"), h
    assert verify_password(long_pw, h), "verify long password"
    assert verify_password("x" * 72 + "y", h), "same first 72 bytes"
    print("bcrypt 72-byte limit: OK")


if __name__ == "__main__":
    main()
