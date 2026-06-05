"""WhatsApp dispatcher — interface + mock + twilio implementations.

A ``MessageResult`` is returned (not raised) for every call, so routes
can include the result in their response (e.g. ``whatsapp_sent``,
``whatsapp_preview``).
"""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass
from typing import Protocol

from sqlalchemy.ext.asyncio import AsyncSession
from twilio.rest import Client
from twilio.http.async_http_client import AsyncTwilioHttpClient
from twilio.base.exceptions import TwilioRestException

from app.models import Rider, WhatsAppMessage
from app.services.i18n import get_message
from app.config import settings

logger = logging.getLogger("road_warrior.whatsapp")


@dataclass(frozen=True)
class MessageResult:
    success: bool
    sid: str | None = None
    error: str | None = None
    body: str = ""  # the rendered message body (also returned for previews)


class WhatsAppDispatcher(Protocol):
    """Interface every WhatsApp backend must implement."""

    async def send_welcome(self, db: AsyncSession, rider: Rider) -> MessageResult: ...
    async def send_milestone(
        self, db: AsyncSession, rider: Rider, milestone: str
    ) -> MessageResult: ...
    async def send_my_score(
        self, db: AsyncSession, rider: Rider, stats: dict
    ) -> MessageResult: ...
    async def send_referral_share(
        self, db: AsyncSession, rider: Rider
    ) -> MessageResult: ...
    async def send_generic(
        self, db: AsyncSession, phone: str, body: str
    ) -> MessageResult: ...


class BaseWhatsAppDispatcher:
    """Base class providing message formatting and DB persistence."""

    async def _send_to_provider(self, phone: str, body: str) -> tuple[str | None, str | None]:
        """Send message via the provider. Returns (sid, error)."""
        raise NotImplementedError

    async def _dispatch_and_persist(
        self,
        db: AsyncSession,
        rider: Rider | None,
        phone: str,
        template: str,
        language: str,
        body: str,
    ) -> MessageResult:
        # First send via provider
        sid, error = await self._send_to_provider(phone, body)
        
        status = "sent" if not error else "failed"

        try:
            db.add(WhatsAppMessage(
                rider_id=rider.id if rider else None,
                phone=phone,
                direction="outbound",
                template=template,
                language=language,
                body=body,
                status=status,
                twilio_sid=sid,
            ))
            await db.flush()
        except Exception as exc:  # noqa: BLE001
            logger.exception("Failed to persist WhatsApp message: %s", exc)
            return MessageResult(success=False, error=str(exc), body=body)

        if error:
            return MessageResult(success=False, error=error, body=body)
            
        return MessageResult(success=True, sid=sid, body=body)

    # ---- public API ----
    async def send_welcome(self, db: AsyncSession, rider: Rider) -> MessageResult:
        lang = rider.preferred_language or "en"
        body = get_message(
            lang, "whatsapp.welcome",
            name=rider.full_name, code=rider.referral_code, points=rider.points,
        )
        return await self._dispatch_and_persist(db, rider, rider.phone, "welcome", lang, body)

    async def send_milestone(
        self, db: AsyncSession, rider: Rider, milestone: str
    ) -> MessageResult:
        lang = rider.preferred_language or "en"
        body = get_message(
            lang, f"whatsapp.milestone_{milestone}",
            name=rider.full_name, count=rider.referral_count, points=rider.points,
        )
        return await self._dispatch_and_persist(db, rider, rider.phone, f"milestone_{milestone}", lang, body)

    async def send_my_score(
        self, db: AsyncSession, rider: Rider, stats: dict
    ) -> MessageResult:
        lang = rider.preferred_language or "en"
        body = get_message(
            lang, "whatsapp.score",
            name=rider.full_name,
            points=stats.get("points", 0),
            count=stats.get("referral_count", 0),
            rank=stats.get("rank", 0),
        )
        return await self._dispatch_and_persist(db, rider, rider.phone, "score", lang, body)

    async def send_referral_share(
        self, db: AsyncSession, rider: Rider
    ) -> MessageResult:
        lang = rider.preferred_language or "en"
        from app.services.qr_service import build_share_url
        share_url = build_share_url(rider.referral_code, settings.frontend_base_url)
        body = get_message(
            lang, "whatsapp.referral_share",
            name=rider.full_name, code=rider.referral_code, url=share_url,
        )
        return await self._dispatch_and_persist(db, rider, rider.phone, "referral_share", lang, body)

    async def send_generic(
        self, db: AsyncSession, phone: str, body: str
    ) -> MessageResult:
        return await self._dispatch_and_persist(db, None, phone, "generic", "en", body)


class MockWhatsAppDispatcher(BaseWhatsAppDispatcher):
    """Logs to console and writes a row in ``whatsapp_messages``."""

    async def _send_to_provider(self, phone: str, body: str) -> tuple[str | None, str | None]:
        sid = f"MOCK-{uuid.uuid4().hex[:12]}"
        logger.info(
            "[WHATSAPP MOCK] To: %s | Body: %s",
            phone, body[:80].replace("\n", " "),
        )
        return sid, None


class TwilioWhatsAppDispatcher(BaseWhatsAppDispatcher):
    """Uses Twilio async SDK to actually send WhatsApp messages."""
    
    def __init__(self) -> None:
        if not settings.twilio_account_sid or not settings.twilio_auth_token:
            raise ValueError("Twilio credentials not configured")
            
        self.client = Client(
            settings.twilio_account_sid,
            settings.twilio_auth_token,
            http_client=AsyncTwilioHttpClient()
        )
        
    def _format_phone(self, phone: str) -> str:
        """Ensure phone number is in E.164 format for WhatsApp.
        Assuming Indian numbers for this context.
        """
        # If it doesn't have country code, prepend it
        cleaned = "".join(filter(str.isdigit, phone))
        if len(cleaned) == 10:
            cleaned = "91" + cleaned
        return f"whatsapp:+{cleaned}"

    async def _send_to_provider(self, phone: str, body: str) -> tuple[str | None, str | None]:
        if not settings.twilio_whatsapp_from:
            return None, "TWILIO_WHATSAPP_FROM not configured"
            
        try:
            formatted_to = self._format_phone(phone)
            logger.info("Sending via Twilio to %s", formatted_to)
            
            message = await self.client.messages.create_async(
                from_=settings.twilio_whatsapp_from,
                to=formatted_to,
                body=body
            )
            return message.sid, None
            
        except TwilioRestException as exc:
            logger.exception("Twilio error sending to %s: %s", phone, exc)
            return None, str(exc)
        except Exception as exc:
            logger.exception("Unexpected error sending to %s: %s", phone, exc)
            return None, str(exc)
