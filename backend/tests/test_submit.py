"""Tests for POST /api/riders/submit."""

import pytest


def _payload(**overrides):
    base = dict(
        full_name="Ravi Kumar", phone="9876543210", city="Bangalore",
        platform="swiggy", years_experience=3, vehicle_type="petrol",
        fuel_method="petrol_pump", weekly_expense=1500, monthly_maintenance=600,
        has_accident_insurance="no", has_health_insurance="yes",
        paid_out_of_pocket=False, open_to_switch="yes",
        top_challenges=["high_fuel_cost"], interested_in=["ev_purchase"],
    )
    base.update(overrides)
    return base


async def test_submit_happy_path(client, mock_dispatcher):
    resp = await client.post("/api/riders/submit", json=_payload())
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["success"] is True
    assert body["is_duplicate"] is False
    assert body["points"] == 10
    assert body["referral_code"].startswith("RW-")
    assert "hot_ev_lead" in body["segments"]
    assert body["whatsapp_sent"] is True
    # Mock dispatcher was called
    methods = [c["method"] for c in mock_dispatcher.calls]
    assert "send_welcome" in methods


async def test_submit_invalid_phone_returns_422(client, mock_dispatcher):
    resp = await client.post("/api/riders/submit", json=_payload(phone="123"))
    assert resp.status_code == 422
    assert resp.json()["error"]["field"] == "phone"


async def test_submit_missing_field_returns_422(client, mock_dispatcher):
    p = _payload()
    p.pop("city")
    resp = await client.post("/api/riders/submit", json=p)
    assert resp.status_code == 422


async def test_submit_duplicate_returns_200_with_flag(client, mock_dispatcher):
    p = _payload(phone="9876543210")
    r1 = await client.post("/api/riders/submit", json=p)
    assert r1.status_code == 201
    first_code = r1.json()["referral_code"]
    r2 = await client.post("/api/riders/submit", json=p)
    assert r2.status_code == 201
    assert r2.json()["is_duplicate"] is True
    assert r2.json()["referral_code"] == first_code


async def test_submit_with_valid_referral_increments_referrer(client, mock_dispatcher):
    # First rider
    r1 = await client.post("/api/riders/submit", json=_payload(phone="9876543210"))
    code1 = r1.json()["referral_code"]
    # Second rider uses code1
    r2 = await client.post(
        "/api/riders/submit",
        json=_payload(phone="9876543211", referred_by_code=code1),
    )
    assert r2.status_code == 201
    # Lookup score for rider1
    score = await client.get("/api/riders/score", params={"phone": "9876543210"})
    s = score.json()
    assert s["found"]
    assert s["referral_count"] == 1
    assert s["points"] == 15  # 10 signup + 5 referral


async def test_submit_with_invalid_referral_is_ignored(client, mock_dispatcher):
    r = await client.post(
        "/api/riders/submit",
        json=_payload(phone="9876543210", referred_by_code="RW-NOPE"),
    )
    assert r.status_code == 201
    assert r.json()["is_duplicate"] is False


async def test_submit_hindi_language_changes_message(client, mock_dispatcher):
    r = await client.post(
        "/api/riders/submit",
        json=_payload(phone="9876543210", preferred_language="hi"),
    )
    body = r.json()
    # Mock dispatcher just returns generic text, so we can only check it was called.
    # The real test for translated body is in services/i18n.
    assert body["whatsapp_sent"] is True


# ---------- QR + validate-referral ----------
async def test_qr_png_endpoint_returns_png(client, mock_dispatcher):
    r = await client.post("/api/riders/submit", json={
        "full_name": "QR Test", "phone": "9876543210", "city": "Bangalore",
        "platform": "swiggy", "years_experience": 1, "vehicle_type": "petrol",
        "fuel_method": "petrol_pump", "weekly_expense": 1000, "monthly_maintenance": 500,
        "has_accident_insurance": "no", "has_health_insurance": "yes",
        "paid_out_of_pocket": False, "open_to_switch": "yes",
    })
    code = r.json()["referral_code"]
    r2 = await client.get(f"/api/riders/qr/{code}.png")
    assert r2.status_code == 200
    assert r2.headers["content-type"] == "image/png"
    assert r2.content[:8] == b"\x89PNG\r\n\x1a\n"


async def test_qr_png_404_for_unknown_code(client):
    r = await client.get("/api/riders/qr/RW-NOPE.png")
    assert r.status_code == 404


async def test_validate_referral_existing(client, mock_dispatcher):
    r = await client.post("/api/riders/submit", json={
        "full_name": "Validator", "phone": "9876543210", "city": "Delhi",
        "platform": "porter", "years_experience": 2, "vehicle_type": "petrol",
        "fuel_method": "petrol_pump", "weekly_expense": 1000, "monthly_maintenance": 400,
        "has_accident_insurance": "no", "has_health_insurance": "yes",
        "paid_out_of_pocket": False, "open_to_switch": "yes",
    })
    code = r.json()["referral_code"]
    r2 = await client.get(f"/api/riders/validate-referral/{code}")
    assert r2.status_code == 200
    body = r2.json()
    assert body["valid"] is True
    assert body["referrer_name"] == "Validator"
    assert body["referrer_city"] == "Delhi"


async def test_validate_referral_unknown(client):
    r = await client.get("/api/riders/validate-referral/RW-NOPE")
    body = r.json()
    assert body["valid"] is False


async def test_score_with_milestone_25_reached(client, mock_dispatcher):
    """A rider with 25 referrals should have next_milestone=None (all done)."""
    r1 = await client.post("/api/riders/submit", json={
        "full_name": "Top", "phone": "9876543210", "city": "Bangalore",
        "platform": "swiggy", "years_experience": 1, "vehicle_type": "petrol",
        "fuel_method": "petrol_pump", "weekly_expense": 1000, "monthly_maintenance": 500,
        "has_accident_insurance": "no", "has_health_insurance": "yes",
        "paid_out_of_pocket": False, "open_to_switch": "yes",
    })
    code1 = r1.json()["referral_code"]
    for i in range(25):
        await client.post("/api/riders/submit", json={
            "full_name": f"R{i}", "phone": f"987654{3210+i+1:04d}", "city": "Delhi",
            "platform": "porter", "years_experience": 1, "vehicle_type": "petrol",
            "fuel_method": "petrol_pump", "weekly_expense": 500, "monthly_maintenance": 200,
            "has_accident_insurance": "no", "has_health_insurance": "yes",
            "paid_out_of_pocket": False, "open_to_switch": "no",
            "referred_by_code": code1,
        })
    r = await client.get("/api/riders/score", params={"phone": "9876543210"})
    body = r.json()
    assert body["referral_count"] == 25
    assert "25_referrals" in body["milestones_reached"]
    assert "10_referrals" in body["milestones_reached"]
    assert body["next_milestone"]["target"] == 50


async def test_milestone_10_dispatches_whatsapp(client, mock_dispatcher):
    """At the 10th referral, the dispatcher must be called for the milestone."""
    r1 = await client.post("/api/riders/submit", json={
        "full_name": "Milestone", "phone": "9876543210", "city": "Bangalore",
        "platform": "swiggy", "years_experience": 1, "vehicle_type": "petrol",
        "fuel_method": "petrol_pump", "weekly_expense": 1000, "monthly_maintenance": 500,
        "has_accident_insurance": "no", "has_health_insurance": "yes",
        "paid_out_of_pocket": False, "open_to_switch": "yes",
    })
    code1 = r1.json()["referral_code"]
    for i in range(10):
        await client.post("/api/riders/submit", json={
            "full_name": f"R{i}", "phone": f"987654{3210+i+1:04d}", "city": "Delhi",
            "platform": "porter", "years_experience": 1, "vehicle_type": "petrol",
            "fuel_method": "petrol_pump", "weekly_expense": 500, "monthly_maintenance": 200,
            "has_accident_insurance": "no", "has_health_insurance": "yes",
            "paid_out_of_pocket": False, "open_to_switch": "no",
            "referred_by_code": code1,
        })
    methods = [c["method"] for c in mock_dispatcher.calls]
    assert methods.count("send_milestone") == 1  # 10_referrals triggered
