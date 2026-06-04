"""Tests for the pure compute_segments function."""

from app.services.segments import compute_segments


def test_empty_answers_returns_empty():
    assert compute_segments({}) == []


def test_ev_rider_segment():
    assert "ev_rider" in compute_segments({"vehicle_type": "electric"})


def test_petrol_rider_segment():
    assert "petrol_rider" in compute_segments({"vehicle_type": "petrol"})


def test_diesel_rider_segment():
    segs = compute_segments({"vehicle_type": "diesel"})
    assert "diesel_rider" in segs
    assert "petrol_rider" in segs  # diesel is a subset of petrol for tagging


def test_swing_rider_segment():
    assert "swing_rider" in compute_segments({"open_to_switch": "yes"})
    assert "swing_rider" in compute_segments({"open_to_switch": "need_info"})


def test_hot_ev_lead_segment():
    segs = compute_segments({"vehicle_type": "petrol", "open_to_switch": "yes"})
    assert "hot_ev_lead" in segs
    segs2 = compute_segments({"vehicle_type": "diesel", "open_to_switch": "yes"})
    assert "hot_ev_lead" in segs2


def test_hot_ev_lead_requires_petrol_or_diesel():
    segs = compute_segments({"vehicle_type": "electric", "open_to_switch": "yes"})
    assert "hot_ev_lead" not in segs


def test_insurance_lead_segment():
    assert "insurance_lead" in compute_segments({"has_accident_insurance": "no"})
    assert "insurance_lead" in compute_segments({"has_health_insurance": "no"})


def test_retrofit_lead_segment():
    segs = compute_segments({"vehicle_type": "petrol", "interested_in": ["retrofit"]})
    assert "retrofit_lead" in segs


def test_rental_lead_segment():
    segs = compute_segments({"interested_in": ["ev_rental"]})
    assert "rental_lead" in segs


def test_accident_victim_segment():
    assert "accident_victim" in compute_segments({"paid_out_of_pocket": True})


def test_high_spender_by_weekly():
    assert "high_spender" in compute_segments({"weekly_expense": 1500})


def test_high_spender_by_monthly():
    assert "high_spender" in compute_segments({"monthly_maintenance": 3000})


def test_veteran_segment():
    assert "veteran" in compute_segments({"years_experience": 3})


def test_returns_sorted():
    segs = compute_segments({
        "vehicle_type": "petrol", "open_to_switch": "yes",
        "has_accident_insurance": "no", "paid_out_of_pocket": True,
        "weekly_expense": 2000, "years_experience": 5,
        "interested_in": ["retrofit", "ev_rental"],
    })
    assert segs == sorted(segs)
    # Verify all expected segments are present
    for expected in ("hot_ev_lead", "swing_rider", "petrol_rider", "high_spender",
                     "veteran", "insurance_lead", "accident_victim",
                     "retrofit_lead", "rental_lead"):
        assert expected in segs
