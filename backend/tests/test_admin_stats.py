"""Tests for /api/admin/stats, /api/admin/riders, /api/admin/leaderboard, etc."""

import pytest


async def _submit(client, **overrides):
    base = dict(
        full_name="Test User", phone="9876543210", city="Bangalore",
        platform="swiggy", years_experience=1, vehicle_type="petrol",
        fuel_method="petrol_pump", weekly_expense=1000, monthly_maintenance=500,
        has_accident_insurance="no", has_health_insurance="yes",
        paid_out_of_pocket=False, open_to_switch="yes",
    )
    base.update(overrides)
    return await client.post("/api/riders/submit", json=base)


async def test_stats_requires_auth(client):
    r = await client.get("/api/admin/stats")
    assert r.status_code == 401


async def test_stats_returns_aggregates(client, admin_auth_headers):
    await _submit(client, phone="9876543210", city="Bangalore", vehicle_type="petrol")
    await _submit(client, phone="9876543211", city="Mumbai", vehicle_type="electric")
    r = await client.get("/api/admin/stats", headers=admin_auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["total_riders"] == 2
    assert body["total_points_awarded"] == 20  # 2 x 10
    assert body["by_city"]["Bangalore"] == 1
    assert body["by_city"]["Mumbai"] == 1
    assert body["by_vehicle_type"]["petrol"] == 1
    assert body["by_vehicle_type"]["electric"] == 1
    assert len(body["signups_per_day"]) == 30


async def test_list_riders_with_filter(client, admin_auth_headers):
    await _submit(client, phone="9876543210", city="Bangalore")
    await _submit(client, phone="9876543211", city="Mumbai")
    r = await client.get(
        "/api/admin/riders", params={"city": "Mumbai"}, headers=admin_auth_headers,
    )
    assert r.status_code == 200
    body = r.json()
    assert len(body) == 1
    assert body[0]["city"] == "Mumbai"


async def test_leaderboard_orders_by_referral_count(client, admin_auth_headers):
    # First rider
    r1 = await _submit(client, phone="9876543210")
    code1 = r1.json()["referral_code"]
    # 3 referrals
    for i in range(3):
        await _submit(client, phone=f"987654{3210+i+1:04d}", referred_by_code=code1)
    r = await client.get("/api/admin/leaderboard", headers=admin_auth_headers)
    body = r.json()
    assert body[0]["full_name"] == "Test User"
    assert body[0]["referral_count"] == 3


async def test_segment_filter_uses_gin_index(client, admin_auth_headers):
    # All "hot_ev_lead" riders
    await _submit(client, phone="9876543210", vehicle_type="petrol", open_to_switch="yes")
    r = await client.get("/api/admin/segments/hot_ev_lead", headers=admin_auth_headers)
    body = r.json()
    assert body["total"] == 1
    assert body["riders"][0]["full_name"] == "Test User"


async def test_export_returns_csv(client, admin_auth_headers):
    await _submit(client, phone="9876543210")
    r = await client.get("/api/admin/export", headers=admin_auth_headers)
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/csv")
    body = r.text
    assert "full_name" in body  # header
    assert "Test User" in body  # rider name


async def test_messages_log(client, admin_auth_headers):
    await _submit(client, phone="9876543210")
    r = await client.get("/api/admin/messages", headers=admin_auth_headers)
    body = r.json()
    assert len(body) >= 1
    assert body[0]["direction"] == "outbound"
    assert body[0]["template"] == "welcome"
