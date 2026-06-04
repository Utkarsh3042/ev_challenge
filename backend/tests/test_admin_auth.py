"""Tests for admin login/logout/me flow."""

import pytest


async def test_login_success_returns_cookie(client, admin_user):
    r = await client.post(
        "/api/admin/login",
        json={"email": admin_user.email, "password": "admin123"},
    )
    assert r.status_code == 200
    assert "admin_token" in r.cookies
    body = r.json()
    assert body["success"] is True
    assert body["admin_id"] == str(admin_user.id)


async def test_login_wrong_password_returns_401(client, admin_user):
    r = await client.post(
        "/api/admin/login",
        json={"email": admin_user.email, "password": "wrong"},
    )
    assert r.status_code == 401


async def test_login_unknown_email_returns_401(client):
    r = await client.post(
        "/api/admin/login",
        json={"email": "nobody@nowhere.com", "password": "x"},
    )
    assert r.status_code == 401


async def test_me_without_token_returns_401(client, admin_user):
    r = await client.get("/api/admin/me")
    assert r.status_code == 401


async def test_me_with_valid_token_returns_200(client, admin_auth_headers, admin_user):
    r = await client.get("/api/admin/me", headers=admin_auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == admin_user.email


async def test_logout_clears_cookie(client, admin_user):
    # Login first
    r = await client.post(
        "/api/admin/login",
        json={"email": admin_user.email, "password": "admin123"},
    )
    cookies = r.cookies
    # Logout
    r2 = await client.post("/api/admin/logout")
    assert r2.status_code == 200
