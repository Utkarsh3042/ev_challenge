"""Referral code generation + the points/milestone engine.

All DB-touching code is async; the only pure helpers (``_random_code``)
are easily testable without a database.
"""

from __future__ import annotations

import secrets
import uuid
from dataclasses import dataclass

from sqlalchemy import func as sql_func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import PointsTransaction, Rider

# ---------- Pure helpers -----------------------------------------------------
def _random_code() -> str:
    """Generate one ``RW-XXXX`` code (alphabet is configured in settings)."""
    alpha = settings.referral_code_alphabet
    length = settings.referral_code_length
    suffix = "".join(secrets.choice(alpha) for _ in range(length))
    return f"{settings.referral_code_prefix}{suffix}"


# ---------- Public result types ----------------------------------------------
@dataclass(frozen=True)
class ReferralAward:
    """Result of a referral-bonus award call (used by tests and routes)."""

    new_points: int
    new_referral_count: int
    triggered_milestones: list[str]


# ---------- Code generation --------------------------------------------------
async def generate_unique_code(db: AsyncSession) -> str:
    """Generate a unique referral code, retrying on collision.

    With a 32-char alphabet and 4-char suffix we have ~1M combinations, so
    collisions are rare. We retry up to ``referral_code_max_attempts`` times
    before giving up — at which point a longer code would be the fix.
    """
    for _ in range(settings.referral_code_max_attempts):
        code = _random_code()
        existing = await db.scalar(select(Rider.id).where(Rider.referral_code == code))
        if existing is None:
            return code
    raise RuntimeError(
        f"Could not generate a unique referral code in "
        f"{settings.referral_code_max_attempts} attempts"
    )


async def find_referrer(db: AsyncSession, code: str) -> Rider | None:
    """Look up the rider who owns ``code``, or ``None`` if not found."""
    if not code:
        return None
    return await db.scalar(select(Rider).where(Rider.referral_code == code))


# ---------- Points engine ---------------------------------------------------
async def _add_points_tx(
    db: AsyncSession,
    rider: Rider,
    type_: str,
    delta: int,
    reason: str | None = None,
    related_rider_id: uuid.UUID | None = None,
) -> PointsTransaction:
    """Mutate the rider's points and append a transaction row in one call."""
    rider.points = (rider.points or 0) + delta
    tx = PointsTransaction(
        rider_id=rider.id,
        type=type_,
        points_delta=delta,
        reason=reason,
        related_rider_id=related_rider_id,
    )
    db.add(tx)
    return tx


async def award_signup_bonus(db: AsyncSession, rider: Rider) -> int:
    """Record the signup bonus in the audit log.

    The rider's ``points`` column is set to ``signup_bonus`` by the DB
    default when the row is INSERTed, so we do **not** add to it here —
    that would double-count. We only append a ``points_transactions`` row
    so the ledger reflects where the points came from.

    If the rider was inserted with a non-default points value (e.g. seed
    data, or a duplicate-handling path), we still top them up to the
    signup bonus so the audit log matches the final balance.
    """
    bonus = settings.signup_bonus
    if rider.points < bonus:
        delta = bonus - rider.points
        await _add_points_tx(
            db,
            rider,
            type_="signup_bonus",
            delta=delta,
            reason="Signup bonus (top-up)",
        )
    else:
        await _add_points_tx(
            db,
            rider,
            type_="signup_bonus",
            delta=0,
            reason="Signup bonus (default)",
        )
    return rider.points


async def award_referral_bonus(
    db: AsyncSession,
    referrer: Rider,
    new_rider: Rider,
) -> ReferralAward:
    """Award the per-referral bonus, increment count, and check milestones.

    All in a single transaction — the caller is responsible for committing.
    """
    # 1) Per-referral bonus
    referrer.referral_count = (referrer.referral_count or 0) + 1
    await _add_points_tx(
        db,
        referrer,
        type_="referral_bonus",
        delta=settings.referral_bonus,
        reason=f"Referral signup: {new_rider.referral_code}",
        related_rider_id=new_rider.id,
    )

    # 2) Milestones — guarded by boolean flags for idempotency
    triggered = await _check_milestones(db, referrer)

    return ReferralAward(
        new_points=referrer.points,
        new_referral_count=referrer.referral_count,
        triggered_milestones=triggered,
    )


async def _check_milestones(db: AsyncSession, rider: Rider) -> list[str]:
    """Award any newly-reached milestone(s) and return their names."""
    triggered: list[str] = []

    milestones = [
        # (flag attr, target count, bonus, name)
        ("milestone_10_reached", settings.milestone_10_referrals,
         settings.milestone_10_bonus, "10_referrals"),
        ("milestone_25_reached", settings.milestone_25_referrals,
         settings.milestone_25_bonus, "25_referrals"),
        ("milestone_50_reached", settings.milestone_50_referrals,
         settings.milestone_50_bonus, "50_referrals"),
    ]

    for flag_attr, target, bonus, name in milestones:
        if getattr(rider, flag_attr):
            continue  # already awarded
        if rider.referral_count >= target:
            setattr(rider, flag_attr, True)
            await _add_points_tx(
                db,
                rider,
                type_=f"milestone_{name}",
                delta=bonus,
                reason=f"Reached {target} referrals",
            )
            triggered.append(name)

    return triggered


async def check_milestones(db: AsyncSession, rider: Rider) -> list[str]:
    """Public alias for :func:`_check_milestones` (kept for tests/clarity)."""
    return await _check_milestones(db, rider)


# ---------- Rank lookup -----------------------------------------------------
async def get_rank_and_total(db: AsyncSession, points: int) -> tuple[int, int]:
    """Return ``(rank, total_riders)`` for a rider with ``points`` points.

    Rank is 1-indexed. A rider with strictly more points ranks above; ties
    are broken by ``id`` (earlier signup ranks higher), but we don't need
    to resolve ties explicitly since rank uses ``>`` not ``>=``.
    """
    total = (await db.scalar(select(sql_func.count(Rider.id)))) or 0
    above = (await db.scalar(
        select(sql_func.count(Rider.id)).where(Rider.points > points)
    )) or 0
    return above + 1, int(total)


__all__ = [
    "ReferralAward",
    "award_referral_bonus",
    "award_signup_bonus",
    "check_milestones",
    "find_referrer",
    "generate_unique_code",
    "get_rank_and_total",
    "IntegrityError",
]
