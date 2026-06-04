"""WhatsApp dispatcher — interface + mock implementation.

PR #4 will add a Twilio-backed implementation and swap it in via
``app.api.deps.get_whatsapp_dispatcher()``. The Protocol here guarantees
that call sites don't change when the real impl lands.

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

from app.models import Rider, WhatsAppMessage
from app.services.i18n import get_message

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


# ---------- Mock implementation ---------------------------------------------
class MockWhatsAppDispatcher:
    """Logs to console and writes a row in ``whatsapp_messages``.

    The body is rendered from the rider's preferred language so the
    admin dashboard (and the API response preview) shows realistic text.
    """

    async def _persist(
        self,
        db: AsyncSession,
        rider: Rider | None,
        phone: str,
        template: str,
        language: str,
        body: str,
    ) -> MessageResult:
        sid = f"MOCK-{uuid.uuid4().hex[:12]}"
        logger.info(
            "[WHATSAPP MOCK] To: %s | Template: %s | Lang: %s | Body: %s",
            phone, template, language, body[:80].replace("\n", " "),
        )
        try:
            db.add(WhatsAppMessage(
                rider_id=rider.id if rider else None,
                phone=phone,
                direction="outbound",
                template=template,
                language=language,
                body=body,
                status="sent",
                twilio_sid=sid,
            ))
            await db.flush()
        except Exception as exc:  # noqa: BLE001
            logger.exception("Failed to persist mock WhatsApp message: %s", exc)
            return MessageResult(success=False, error=str(exc), body=body)
        return MessageResult(success=True, sid=sid, body=body)

    # ---- public API ----
    async def send_welcome(self, db: AsyncSession, rider: Rider) -> MessageResult:
        lang = rider.preferred_language or "en"
        body = get_message(
            lang, "whatsapp.welcome",
            name=rider.full_name, code=rider.referral_code, points=rider.points,
        )
        return await self._persist(db, rider, rider.phone, "welcome", lang, body)

    async def send_milestone(
        self, db: AsyncSession, rider: Rider, milestone: str
    ) -> MessageResult:
        lang = rider.preferred_language or "en"
        body = get_message(
            lang, f"whatsapp.milestone_{milestone}",
            name=rider.full_name, count=rider.referral_count, points=rider.points,
        )
        return await self._persist(db, rider, rider.phone, f"milestone_{milestone}", lang, body)

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
        return await self._persist(db, rider, rider.phone, "score", lang, body)

    async def send_referral_share(
        self, db: AsyncSession, rider: Rider
    ) -> MessageResult:
        lang = rider.preferred_language or "en"
        from app.services.qr_service import build_share_url
        from app.config import settings
        share_url = build_share_url(rider.referral_code, settings.frontend_base_url)
        body = get_message(
            lang, "whatsapp.referral_share",
            name=rider.full_name, code=rider.referral_code, url=share_url,
        )
        return await self._persist(db, rider, rider.phone, "referral_share", lang, body)

    async def send_generic(
        self, db: AsyncSession, phone: str, body: str
    ) -> MessageResult:
        return await self._persist(db, None, phone, "generic", "en", body)
