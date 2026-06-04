"""Tests for the referral service: code generation, points engine, milestones."""

import pytest
from sqlalchemy import delete, select

from app.models import PointsTransaction, Rider
from app.services.referral import (
    ReferralAward, award_referral_bonus, award_signup_bonus, check_milestones,
    find_referrer, generate_unique_code, get_rank_and_total,
)


async def _make_rider(db, **overrides) -> Rider:
    base = dict(
        full_name="Test Rider", phone="+919876543210", city="Bangalore",
        platform="swiggy", years_experience=3, vehicle_type="petrol",
        fuel_method="petrol_pump", weekly_expense=1000, monthly_maintenance=500,
        has_accident_insurance="no", has_health_insurance="yes",
        paid_out_of_pocket=False, open_to_switch="yes",
        referral_code="RW-TEST1",
    )
    base.update(overrides)
    r = Rider(**base)
    db.add(r)
    await db.flush()
    return r


async def test_generate_unique_code_format(db_session):
    code = await generate_unique_code(db_session)
    assert code.startswith("RW-")
    assert len(code) == 7  # RW- + 4 chars


async def test_generate_unique_code_avoids_existing(db_session):
    r = await _make_rider(db_session, referral_code="RW-AB23")
    code = await generate_unique_code(db_session)
    assert code != "RW-AB23"


async def test_find_referrer_returns_match(db_session):
    r = await _make_rider(db_session, referral_code="RW-FIND")
    found = await find_referrer(db_session, "RW-FIND")
    assert found is not None
    assert found.id == r.id


async def test_find_referrer_returns_none(db_session):
    assert await find_referrer(db_session, "RW-NOPE") is None
    assert await find_referrer(db_session, "") is None


async def test_award_signup_bonus_writes_audit_row(db_session):
    r = await _make_rider(db_session)
    await award_signup_bonus(db_session, r)
    await db_session.commit()
    txs = (await db_session.execute(
        select(PointsTransaction).where(PointsTransaction.rider_id == r.id)
    )).scalars().all()
    assert len(txs) == 1
    assert txs[0].type == "signup_bonus"


async def test_award_referral_bonus_increments_count(db_session):
    referrer = await _make_rider(db_session, referral_code="RW-A", phone="+919876543210")
    new_rider = await _make_rider(db_session, referral_code="RW-B", phone="+919876543211")
    await award_signup_bonus(db_session, referrer)
    await award_signup_bonus(db_session, new_rider)
    award = await award_referral_bonus(db_session, referrer, new_rider)
    await db_session.commit()
    assert referrer.referral_count == 1
    assert award.new_referral_count == 1
    assert award.triggered_milestones == []


async def test_milestone_10_triggers_at_10_referrals(db_session):
    referrer = await _make_rider(db_session, referral_code="RW-M10", phone="+919876543210")
    await award_signup_bonus(db_session, referrer)
    for i in range(10):
        nr = await _make_rider(
            db_session, referral_code=f"RW-M10R{i}", phone=f"+91987{6000000+i:07d}",
        )
        await award_signup_bonus(db_session, nr)
        await award_referral_bonus(db_session, referrer, nr)
    await db_session.commit()
    assert referrer.referral_count == 10
    assert referrer.milestone_10_reached is True
    # 10 (signup) + 50 (10 referrals x 5) + 100 (milestone 10) = 160
    assert referrer.points == 160


async def test_milestone_is_idempotent(db_session):
    """A second call to check_milestones must not re-award."""
    referrer = await _make_rider(db_session, referral_code="RW-IDEM", phone="+919876543210")
    referrer.referral_count = 10
    referrer.milestone_10_reached = False
    triggered1 = await check_milestones(db_session, referrer)
    assert "10_referrals" in triggered1
    triggered2 = await check_milestones(db_session, referrer)
    assert triggered2 == []


async def test_rank_and_total(db_session):
    r1 = await _make_rider(db_session, referral_code="RW-R1", phone="+919876543210", points=50)
    r2 = await _make_rider(db_session, referral_code="RW-R2", phone="+919876543211", points=20)
    rank1, total = await get_rank_and_total(db_session, 50)
    assert rank1 == 1
    assert total == 2
    rank2, _ = await get_rank_and_total(db_session, 20)
    assert rank2 == 2
