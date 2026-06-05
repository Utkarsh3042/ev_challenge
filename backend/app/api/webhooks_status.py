"""Webhook for Twilio message status callbacks."""

import logging

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select

from app.api.deps import DbSession, TwilioSignatureDep
from app.models.whatsapp import WhatsAppMessage
from app.schemas.whatsapp import WebhookAck

logger = logging.getLogger("road_warrior.webhook_status")
router = APIRouter(tags=["webhooks"])


@router.post(
    "/webhooks/whatsapp/status",
    response_model=WebhookAck,
    summary="Twilio WhatsApp status callback",
    dependencies=[TwilioSignatureDep],
)
async def whatsapp_status_webhook(
    request: Request,
    db: DbSession,
) -> WebhookAck:
    """Handle delivery status updates from Twilio."""
    try:
        form = await request.form()
        message_sid_val = form.get("MessageSid")
        message_sid = message_sid_val if isinstance(message_sid_val, str) else None
        
        status_val = form.get("MessageStatus")
        status = status_val if isinstance(status_val, str) else None
        
        error_code_val = form.get("ErrorCode")
        error_code = error_code_val if isinstance(error_code_val, str) else None
        
        error_message_val = form.get("ErrorMessage")
        error_message = error_message_val if isinstance(error_message_val, str) else None

        if not message_sid or not status:
            return WebhookAck(status="ok", reply="missing sid or status")

        msg = await db.scalar(
            select(WhatsAppMessage).where(WhatsAppMessage.twilio_sid == message_sid)
        )
        if msg:
            msg.status = status
            if error_message:
                msg.error = f"{error_code}: {error_message}"
            await db.commit()
            logger.info("Message %s status updated to %s", message_sid, status)
        else:
            logger.warning("Status update for unknown message sid %s", message_sid)

    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to parse status webhook payload: %s", exc)

    return WebhookAck(status="ok", reply="processed")
