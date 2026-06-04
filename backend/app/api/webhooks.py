"""Twilio WhatsApp inbound webhook — stub for PR #2, real bot in PR #4."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Request, Response

from app.schemas.whatsapp import TwilioWebhookPayload, WebhookAck

logger = logging.getLogger("road_warrior.webhook")
router = APIRouter(tags=["webhooks"])


@router.post(
    "/webhooks/whatsapp",
    response_model=WebhookAck,
    summary="Twilio WhatsApp inbound webhook (PR #4 implements the bot logic)",
)
async def whatsapp_webhook(
    request: Request,
) -> WebhookAck:
    """Accept any POST and log the payload. Returns 200 OK for Twilio.

    In PR #4 this will:
      - Verify Twilio's request signature
      - Look up / create a ``WhatsAppSession`` for the sender
      - Route the message to the right step in the conversation flow
      - Send back a reply via the dispatcher

    For now we just acknowledge so Twilio doesn't retry.
    """
    try:
        # Twilio sends application/x-www-form-urlencoded by default.
        # We don't depend on the schema here (PR #4 will).
        form = await request.form()
        sender = form.get("From", "<unknown>")
        body = form.get("Body", "")
        logger.info("[WEBHOOK] from=%s body=%s", sender, str(body)[:80])
    except Exception as exc:  # noqa: BLE001
        logger.warning("Webhook payload parse failed: %s", exc)

    return WebhookAck(status="ok", reply="(stub — real handler arrives in PR #4)")
