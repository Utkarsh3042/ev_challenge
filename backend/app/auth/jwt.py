"""JWT helpers: create/decode HS256 tokens for admin auth."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt

from app.config import settings

# Common claim names
CLAIM_SUB = "sub"        # subject (admin id as string)
CLAIM_EMAIL = "email"    # admin email (for display)
CLAIM_TYPE = "type"      # token type ("access" | "refresh")
CLAIM_EXP = "exp"        # expiry timestamp
CLAIM_IAT = "iat"        # issued-at timestamp


class TokenError(Exception):
    """Raised when a JWT cannot be decoded or has expired."""


def create_access_token(
    subject: str | uuid.UUID,
    email: str | None = None,
    expires_delta: timedelta | None = None,
) -> str:
    """Create an HS256 access token. ``subject`` is the admin id."""
    now = datetime.now(tz=timezone.utc)
    expires = now + (expires_delta or timedelta(minutes=settings.jwt_expires_min))
    payload: dict[str, Any] = {
        CLAIM_SUB: str(subject),
        CLAIM_EMAIL: email,
        CLAIM_TYPE: "access",
        CLAIM_IAT: int(now.timestamp()),
        CLAIM_EXP: int(expires.timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict[str, Any]:
    """Decode and verify a token. Raises ``TokenError`` on any failure."""
    if not token:
        raise TokenError("Empty token")
    try:
        return jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError as exc:
        raise TokenError(f"Invalid token: {exc}") from exc
