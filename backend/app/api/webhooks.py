"""Twilio WhatsApp inbound webhook — stub for PR #2, real bot in PR #4."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Request, Response

from app.schemas.whatsapp import TwilioWebhookPayload, WebhookAck

logger = logging.getLogger("road_warrior.webhook")
router = APIRouter(tags=["webhooks"])


from typing import Annotated
from fastapi import APIRouter, Depends, Request
from sqlalchemy import select

from app.api.deps import DbSession, DispatcherDep, TwilioSignatureDep
from app.models.rider import Rider
from app.models.whatsapp import WhatsAppMessage
from app.schemas.whatsapp import WebhookAck
from app.services.phone import normalize
from app.services.whatsapp_chatbot import process_message

logger = logging.getLogger("road_warrior.webhook")
router = APIRouter(tags=["webhooks"])

@router.post(
    "/webhooks/whatsapp",
    response_model=WebhookAck,
    summary="Twilio WhatsApp inbound webhook",
    dependencies=[TwilioSignatureDep],
)
async def whatsapp_webhook(
    request: Request,
    db: DbSession,
    dispatcher: DispatcherDep,
) -> WebhookAck:
    """Accept incoming WhatsApp messages and route to the chatbot."""
    try:
        form = await request.form()
        sender_val = form.get("From", "")
        sender_raw = sender_val if isinstance(sender_val, str) else ""
        
        body_val = form.get("Body", "")
        body = body_val.strip() if isinstance(body_val, str) else ""
        
        # Twilio sends numbers as "whatsapp:+919876543210"
        if sender_raw.startswith("whatsapp:"):
            sender_raw = sender_raw.replace("whatsapp:", "")
            
        try:
            phone = normalize(sender_raw)
        except ValueError:
            logger.warning("Received webhook from invalid phone: %s", sender_raw)
            return WebhookAck(status="ok", reply="invalid phone")

        logger.info("[WEBHOOK INBOUND] from=%s body=%s", phone, body[:80])
        
        # Look up rider to attach to message if they exist
        rider = await db.scalar(select(Rider).where(Rider.phone == phone))
        
        # Persist the inbound message
        db.add(WhatsAppMessage(
            rider_id=rider.id if rider else None,
            phone=phone,
            direction="inbound",
            template=None,
            language=rider.preferred_language if rider else "en",
            body=body,
            status="delivered", # It's inbound, so it's already delivered to us
            twilio_sid=form.get("MessageSid"),
        ))
        await db.flush()
        
        # Process via Chatbot state machine
        await process_message(db, dispatcher, phone, body)
        
    except Exception as exc:  # noqa: BLE001
        logger.exception("Webhook payload parse failed: %s", exc)

    return WebhookAck(status="ok", reply="processed")
