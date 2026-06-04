"""Tests for GET /api/riders/score."""

import pytest


async def test_score_for_existing_rider(client, mock_dispatcher):
    await client.post("/api/riders/submit", json={
        "full_name": "Anil", "phone": "9876543210", "city": "Mumbai",
        "platform": "zomato", "years_experience": 5, "vehicle_type": "petrol",
        "fuel_method": "petrol_pump", "weekly_expense": 2000, "monthly_maintenance": 700,
        "has_accident_insurance": "yes", "has_health_insurance": "yes",
        "paid_out_of_pocket": False, "open_to_switch": "yes",
    })
    r = await client.get("/api/riders/score", params={"phone": "9876543210"})
    assert r.status_code == 200
    body = r.json()
    assert body["found"] is True
    assert body["name"] == "Anil"
    assert body["points"] == 10
    assert body["referral_count"] == 0
    assert body["total_riders"] == 1
    assert body["rank"] == 1
    assert body["share_url"].endswith(body["referral_code"])


async def test_score_for_unknown_phone(client, mock_dispatcher):
    r = await client.get("/api/riders/score", params={"phone": "9999999999"})
    body = r.json()
    assert body["found"] is False


async def test_score_rank_orders_by_points(client, mock_dispatcher):
    # Create three riders with different points (via referral chains)
    r1 = await client.post("/api/riders/submit", json={
        "full_name": "Low", "phone": "9876543210", "city": "Bangalore",
        "platform": "swiggy", "years_experience": 1, "vehicle_type": "petrol",
        "fuel_method": "petrol_pump", "weekly_expense": 500, "monthly_maintenance": 100,
        "has_accident_insurance": "yes", "has_health_insurance": "yes",
        "paid_out_of_pocket": False, "open_to_switch": "no",
    })
    code1 = r1.json()["referral_code"]
    # 4 referrals -> r1 has 10 + 20 = 30 points
    for i in range(4):
        await client.post("/api/riders/submit", json={
            "full_name": f"Ref{i}", "phone": f"987654{3210+i+1:04d}", "city": "Delhi",
            "platform": "porter", "years_experience": 1, "vehicle_type": "petrol",
            "fuel_method": "petrol_pump", "weekly_expense": 500, "monthly_maintenance": 100,
            "has_accident_insurance": "yes", "has_health_insurance": "yes",
            "paid_out_of_pocket": False, "open_to_switch": "no",
            "referred_by_code": code1,
        })
    # Check rank
    r = await client.get("/api/riders/score", params={"phone": "9876543210"})
    body = r.json()
    assert body["found"]
    assert body["points"] == 30
    assert body["rank"] == 1
    assert body["referral_count"] == 4
    assert body["next_milestone"] is not None
    assert body["next_milestone"]["target"] == 10
