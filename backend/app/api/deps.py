"""Shared FastAPI dependencies: DB session, current admin, dispatcher.

Kept in one module so every router can import from a single place
and so we can swap implementations in tests via ``app.dependency_overrides``.
"""

from __future__ import annotations

import logging
import uuid
from collections.abc import AsyncIterator

logger = logging.getLogger("road_warrior.deps")
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
from app.services.whatsapp_dispatcher import TwilioWhatsAppDispatcher
from app.config import settings

def get_whatsapp_dispatcher() -> WhatsAppDispatcher:
    """Return the configured dispatcher.

    Returns Twilio impl if credentials are set, otherwise falls back to Mock.
    """
    if settings.whatsapp_mode == "twilio" and settings.twilio_account_sid and settings.twilio_auth_token:
        try:
            return TwilioWhatsAppDispatcher()
        except ValueError:
            pass
            
    return MockWhatsAppDispatcher()

DispatcherDep = Annotated[WhatsAppDispatcher, Depends(get_whatsapp_dispatcher)]

# ---------- Webhook Security ------------------------------------------------
from twilio.request_validator import RequestValidator

async def verify_twilio_signature(request: Request) -> None:
    """Dependency to verify X-Twilio-Signature header on webhooks."""
    if not settings.whatsapp_signature_verify:
        return

    # Use explicit token for signing if set, else fallback to standard auth token
    token = getattr(settings, "twilio_auth_token_for_signing", settings.twilio_auth_token)
    if not token:
        logger.warning("Twilio auth token missing; cannot verify signature")
        raise HTTPException(status_code=403, detail="Signature verification failed")

    validator = RequestValidator(token)
    
    # Use configured webhook URL if behind a proxy/ngrok, else request URL
    url = settings.twilio_webhook_url or str(request.url)
    
    # Twilio signatures are verified using form POST params
    form_data = await request.form()
    params = {k: v for k, v in form_data.items()}
    
    signature = request.headers.get("X-Twilio-Signature", "")
    
    if not validator.validate(url, params, signature):
        logger.warning("Invalid Twilio signature! url=%s", url)
        raise HTTPException(status_code=403, detail="Invalid signature")

TwilioSignatureDep = Depends(verify_twilio_signature)
