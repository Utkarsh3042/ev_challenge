"""Smoke tests — verify the skeleton app responds correctly (no DB needed)."""

from __future__ import annotations


def test_health_endpoint_returns_ok(sync_client, health_payload):
    assert health_payload["status"] == "ok"
    assert "app" in health_payload
    assert "version" in health_payload


def test_root_endpoint_reachable(sync_client):
    resp = sync_client.get("/")
    assert resp.status_code == 200
    body = resp.json()
    assert "message" in body
    assert body["docs"] == "/docs"
    assert body["health"] == "/api/health"


def test_openapi_docs_available(sync_client):
    resp = sync_client.get("/openapi.json")
    assert resp.status_code == 200
    spec = resp.json()
    assert "paths" in spec
    assert "/api/health" in spec["paths"]
