"""Dashboard aggregations for the admin ``/stats`` endpoint."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from sqlalchemy import case, func as sql_func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Rider
from app.schemas.admin import DayCount, StatsResponse
from app.services.segments import compute_segments


async def _group_count(db: AsyncSession, column) -> dict[str, int]:
    """Return ``{value: count}`` for a categorical column on ``riders``."""
    rows = await db.execute(
        select(column, sql_func.count(Rider.id)).group_by(column)
    )
    return {str(k): int(v) for k, v in rows.all() if k is not None}


async def get_dashboard_stats(db: AsyncSession) -> StatsResponse:
    """Compute the full StatsResponse payload in a few round-trips."""
    # ---------- Total riders & points ----------
    total_riders = (await db.scalar(select(sql_func.count(Rider.id)))) or 0
    total_points = (await db.scalar(select(sql_func.coalesce(
        sql_func.sum(Rider.points), 0
    )))) or 0
    active_referrers = (await db.scalar(
        select(sql_func.count(Rider.id)).where(Rider.referral_count > 0)
    )) or 0

    # ---------- Categorical breakdowns ----------
    by_vehicle = await _group_count(db, Rider.vehicle_type)
    by_city = await _group_count(db, Rider.city)
    by_platform = await _group_count(db, Rider.platform)
    by_language = await _group_count(db, Rider.preferred_language)

    # ---------- Hot lead counts (re-derive from segments) ----------
    # We re-compute from each rider's answers. For a 25-rider dashboard this
    # is fast (Python loop); for >10k rows we'd move this to a SQL-side
    # tag-explode or maintain a denormalized `segments` column (we already
    # do) and use `segments @> ARRAY['hot_ev_lead']`.
    all_answers = (await db.execute(
        select(
            Rider.vehicle_type, Rider.open_to_switch,
            Rider.has_accident_insurance, Rider.has_health_insurance,
            Rider.paid_out_of_pocket, Rider.interested_in,
            Rider.weekly_expense, Rider.monthly_maintenance,
            Rider.years_experience,
        )
    )).all()
    hot_ev_leads = insurance_leads = retrofit_leads = 0
    for v_type, open_to, acc_ins, hlt_ins, paid_oop, interested, weekly, monthly, years in all_answers:
        segs = compute_segments({
            "vehicle_type": v_type, "open_to_switch": open_to,
            "has_accident_insurance": acc_ins, "has_health_insurance": hlt_ins,
            "paid_out_of_pocket": paid_oop, "interested_in": interested or [],
            "weekly_expense": weekly, "monthly_maintenance": monthly,
            "years_experience": years,
        })
        if "hot_ev_lead" in segs:
            hot_ev_leads += 1
        if "insurance_lead" in segs:
            insurance_leads += 1
        if "retrofit_lead" in segs:
            retrofit_leads += 1

    # ---------- Signups per day (last 30 days) ----------
    today = datetime.now(tz=timezone.utc).date()
    start = today - timedelta(days=29)
    rows = await db.execute(
        select(
            sql_func.date(Rider.created_at).label("d"),
            sql_func.count(Rider.id),
        )
        .where(Rider.created_at >= start)
        .group_by("d")
        .order_by("d")
    )
    bucket: dict[date, int] = {start + timedelta(days=i): 0 for i in range(30)}
    for d, c in rows.all():
        if d is not None:
            bucket[d] = int(c)
    signups_per_day = [DayCount(date=k.isoformat(), count=v) for k, v in bucket.items()]

    return StatsResponse(
        total_riders=int(total_riders),
        total_points_awarded=int(total_points),
        active_referrers=int(active_referrers),
        hot_ev_leads=hot_ev_leads,
        insurance_leads=insurance_leads,
        retrofit_leads=retrofit_leads,
        by_vehicle_type=by_vehicle,
        by_city=by_city,
        by_platform=by_platform,
        by_language=by_language,
        signups_per_day=signups_per_day,
    )
