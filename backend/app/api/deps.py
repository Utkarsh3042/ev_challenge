"""Shared FastAPI dependencies: DB session, current admin, dispatcher.

Kept in one module so every router can import from a single place
and so we can swap implementations in tests via ``app.dependency_overrides``.
"""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import TokenError, decode_token
from app.database import get_db
from app.models import Admin
from app.services.whatsapp_dispatcher import MockWhatsAppDispatcher, WhatsAppDispatcher
from sqlalchemy import select

# Re-export so routers can just do `Depends(get_db)`
__all__ = [
    "get_db",
    "get_current_admin",
    "get_current_admin_id",
    "get_whatsapp_dispatcher",
]


# ---------- DB session (re-exported) ----------------------------------------
async def _get_db() -> AsyncIterator[AsyncSession]:
    async for session in get_db():
        yield session


DbSession = Annotated[AsyncSession, Depends(_get_db)]


# ---------- Admin auth -------------------------------------------------------
# ``HTTPBearer`` reads a Bearer token from the ``Authorization`` header. We
# also support the ``admin_token`` cookie (set by /api/admin/login) so the
# admin UI doesn't need to manage tokens in JS.
_bearer = HTTPBearer(auto_error=False)


async def get_current_admin(
    request: Request,
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    db: DbSession,
) -> Admin:
    """Return the authenticated Admin, or raise 401."""
    token: str | None = None
    if creds and creds.scheme.lower() == "bearer":
        token = creds.credentials
    if not token:
        token = request.cookies.get("admin_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Missing admin token"},
        )
    try:
        claims = decode_token(token)
    except TokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": str(exc)},
        ) from exc

    admin_id_str = claims.get("sub")
    if not admin_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Token missing subject"},
        )
    try:
        admin_id = uuid.UUID(admin_id_str)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Bad subject in token"},
        ) from exc

    admin = await db.scalar(select(Admin).where(Admin.id == admin_id, Admin.is_active.is_(True)))
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Admin not found or inactive"},
        )
    return admin


CurrentAdmin = Annotated[Admin, Depends(get_current_admin)]


async def get_current_admin_id(admin: CurrentAdmin) -> uuid.UUID:
    return admin.id


CurrentAdminId = Annotated[uuid.UUID, Depends(get_current_admin_id)]


# ---------- WhatsApp dispatcher ---------------------------------------------
def get_whatsapp_dispatcher() -> WhatsAppDispatcher:
    """Return the configured dispatcher.

    PR #4 will branch on ``settings.whatsapp_mode`` to return a Twilio impl.
    """
    return MockWhatsAppDispatcher()


DispatcherDep = Annotated[WhatsAppDispatcher, Depends(get_whatsapp_dispatcher)]
