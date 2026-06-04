"""Schemas for WhatsApp webhook payloads (PR #4 will use these for real Twilio)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class TwilioWebhookPayload(BaseModel):
    """Subset of fields Twilio sends in a WhatsApp inbound webhook.

    We only model the fields we actually need; anything else is ignored.
    Real PR #4 will use ``model_config.populate_by_name`` to map
    ``From`` / ``Body`` etc. but we keep snake_case for now.
    """

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    from_: str = Field(
        default="", alias="From",
        description="Sender's WhatsApp number, e.g. 'whatsapp:+919876543210'",
    )
    body: str = Field(default="", alias="Body", description="Message text")
    message_sid: str = Field(default="", alias="MessageSid")
    profile_name: str = Field(default="", alias="ProfileName")
    wa_id: str = Field(default="", alias="WaId")
    to: str = Field(default="", alias="To")


class WebhookAck(BaseModel):
    """TwiML-style minimal ack returned from the webhook endpoint."""

    status: Literal["ok", "error"] = "ok"
    reply: str = ""


class MessageLogItem(BaseModel):
    """One row in the admin's WhatsApp messages log."""

    id: str
    phone: str
    direction: str
    template: str | None
    language: str | None
    body: str
    status: str
    error: str | None
    sent_at: str
