"""Direct unit tests for app.services.stats (no HTTP)."""

import pytest
from sqlalchemy import delete

from app.models import Admin, PointsTransaction, Rider
from app.services.referral import award_referral_bonus, award_signup_bonus
from app.services.stats import get_dashboard_stats


async def _make_rider(db, **kw) -> Rider:
    base = dict(
        full_name="Stats", phone="+919876543210", city="Bangalore",
        platform="swiggy", years_experience=2, vehicle_type="petrol",
        fuel_method="petrol_pump", weekly_expense=1000, monthly_maintenance=500,
        has_accident_insurance="no", has_health_insurance="yes",
        paid_out_of_pocket=False, open_to_switch="yes",
        referral_code="RW-STATS",
    )
    base.update(kw)
    r = Rider(**base)
    db.add(r)
    await db.flush()
    await award_signup_bonus(db, r)
    return r


async def test_stats_empty_db(db_session):
    s = await get_dashboard_stats(db_session)
    assert s.total_riders == 0
    assert s.total_points_awarded == 0
    assert s.active_referrers == 0
    assert s.hot_ev_leads == 0
    assert len(s.signups_per_day) == 30
    assert all(d.count == 0 for d in s.signups_per_day)


async def test_stats_with_data(db_session):
    await _make_rider(db_session, city="Bangalore", vehicle_type="petrol",
                       open_to_switch="yes")
    await _make_rider(db_session, phone="+919876543211", city="Mumbai",
                       vehicle_type="electric", open_to_switch="already_ev")
    s = await get_dashboard_stats(db_session)
    assert s.total_riders == 2
    assert s.total_points_awarded == 20
    assert s.by_city == {"Bangalore": 1, "Mumbai": 1}
    assert s.by_vehicle_type == {"petrol": 1, "electric": 1}
    assert s.hot_ev_leads == 1
    assert s.insurance_leads == 2  # both have has_accident_insurance='no'


async def test_stats_active_referrer_count(db_session):
    r1 = await _make_rider(db_session, phone="+919876543210", referral_count=0)
    r2 = await _make_rider(db_session, phone="+919876543211", referral_count=3)
    s = await get_dashboard_stats(db_session)
    assert s.active_referrers == 1  # only r2


async def test_stats_signups_per_day_30_days(db_session):
    s = await get_dashboard_stats(db_session)
    assert len(s.signups_per_day) == 30
    assert all(len(d.date) == 10 for d in s.signups_per_day)  # YYYY-MM-DD
