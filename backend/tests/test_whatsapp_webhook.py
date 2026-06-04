"""Tests for the WhatsApp inbound webhook (stub)."""

import pytest


async def test_webhook_accepts_post(client):
    resp = await client.post(
        "/api/webhooks/whatsapp",
        data={"From": "whatsapp:+919876543210", "Body": "hi", "MessageSid": "SM123"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert "PR #4" in body["reply"]


async def test_webhook_accepts_empty_payload(client):
    resp = await client.post("/api/webhooks/whatsapp", data={})
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
