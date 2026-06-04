"""Seed script — creates one admin + sample riders + 2 referral chains.

Idempotent: re-running won't duplicate. Use ``--reset`` to wipe first.

Run via: ``python -m app.utils.seed`` or ``make seed``.
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import random
from typing import Any

from sqlalchemy import delete, select

from app.auth.security import hash_password
from app.database import AsyncSessionLocal
from app.models import Admin, PointsTransaction, Rider
from app.services.referral import (
    award_referral_bonus, award_signup_bonus, generate_unique_code,
)
from app.services.segments import compute_segments

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(message)s")
log = logging.getLogger("seed")

DEFAULT_ADMIN_EMAIL = "admin@roadwarrior.in"
DEFAULT_ADMIN_PASSWORD = "admin123"


def _make_rider_payload(
    name: str, phone: str, city: str, platform: str, vehicle: str,
    years: int, weekly: int, monthly: int, language: str = "en",
    insurance: str = "no", health: str = "yes", oop: bool = False,
    open_to: str = "yes", interested: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "full_name": name, "phone": phone, "city": city, "platform": platform,
        "years_experience": years, "preferred_language": language,
        "vehicle_type": vehicle, "vehicle_brand_model": None,
        "fuel_method": "petrol_pump" if vehicle in ("petrol", "diesel") else "home_charging",
        "weekly_expense": weekly, "monthly_maintenance": monthly,
        "has_accident_insurance": insurance, "has_health_insurance": health,
        "paid_out_of_pocket": oop, "open_to_switch": open_to,
        "switch_motivators": [], "interested_in": interested or [],
        "top_challenges": ["high_fuel_cost"],
        "ev_challenges": [], "petrol_challenges": [],
    }


# ---------- Main seed logic -------------------------------------------------
async def seed(reset: bool = False) -> None:
    rng = random.Random(42)  # deterministic

    async with AsyncSessionLocal() as db:
        if reset:
            log.info("Reset: deleting all data")
            await db.execute(delete(PointsTransaction))
            await db.execute(delete(Rider))
            await db.execute(delete(Admin))
            await db.commit()

        # Admin
        if (await db.scalar(select(Admin).limit(1))) is None:
            admin = Admin(
                email=DEFAULT_ADMIN_EMAIL,
                password_hash=hash_password(DEFAULT_ADMIN_PASSWORD),
                is_active=True,
            )
            db.add(admin)
            await db.commit()
            log.info("Created admin  %s / %s", DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD)
        else:
            log.info("Admin exists, skipping")

        if (await db.scalar(select(Rider.id).limit(1))) is not None:
            log.info("Riders exist, skipping (use --reset to wipe)")
            return

        # Phone generator
        seq = {"i": 0}
        def next_phone() -> str:
            seq["i"] += 1
            return f"+91987{7000000 + seq['i']:07d}"

        # Specs
        specs: list[dict[str, Any]] = [
            *(_spec(i, "Bangalore", "swiggy", "petrol", "en") for i in range(5)),
            *(_spec(i, "Bangalore", "blinkit", "electric", "en") for i in range(3)),
            *(_spec(i, "Delhi", "porter", "diesel", "hi") for i in range(3)),
            *(_spec(i, "Mumbai", "dunzo", "petrol", "hi") for i in range(4)),
            *(_spec(i, "Hyderabad", "zomato", "electric", "en") for i in range(2)),
            *(_spec(i, "Chennai", "swiggy", "petrol", "kn") for i in range(4)),
            *(_spec(i, "Other", "other", "petrol", "en") for i in range(4)),
        ]

        # Anchors
        a_spec, b_spec = specs[0], specs[5]
        a_code = await generate_unique_code(db)
        anchor_a = Rider(referral_code=a_code, **_make_rider_payload(
            a_spec["name"], next_phone(), a_spec["city"], a_spec["platform"],
            a_spec["vehicle"], 3, 1500, 600, language=a_spec["language"],
            open_to="yes"))
        db.add(anchor_a); await db.flush(); await award_signup_bonus(db, anchor_a)

        b_code = await generate_unique_code(db)
        anchor_b = Rider(referral_code=b_code, **_make_rider_payload(
            b_spec["name"], next_phone(), b_spec["city"], b_spec["platform"],
            b_spec["vehicle"], 2, 400, 200, language=b_spec["language"],
            open_to="already_ev"))
        db.add(anchor_b); await db.flush(); await award_signup_bonus(db, anchor_b)
        await db.commit()
        log.info("Anchors: %s (%s)  and  %s (%s)",
                 anchor_a.full_name, anchor_a.referral_code,
                 anchor_b.full_name, anchor_b.referral_code)

        # 12 riders -> anchor A (milestone 10)
        for i in range(12):
            sp = _spec(i, rng.choice(["Bangalore", "Mumbai"]), "swiggy", "petrol", "en")
            r = Rider(referral_code=await generate_unique_code(db),
                      referred_by_code=anchor_a.referral_code,
                      **_make_rider_payload(
                          f"ReferredA-{i+1}", next_phone(), sp["city"], sp["platform"],
                          sp["vehicle"], 1, 1200, 500, language=sp["language"]))
            db.add(r); await db.flush()
            await award_signup_bonus(db, r)
            await award_referral_bonus(db, anchor_a, r)
        await db.commit()
        log.info("12 referrals -> %s", anchor_a.full_name)

        # 30 riders -> anchor B (milestones 10 + 25)
        for i in range(30):
            sp = _spec(i, rng.choice(["Hyderabad", "Chennai"]), "zomato", "petrol", "en")
            r = Rider(referral_code=await generate_unique_code(db),
                      referred_by_code=anchor_b.referral_code,
                      **_make_rider_payload(
                          f"ReferredB-{i+1}", next_phone(), sp["city"], sp["platform"],
                          sp["vehicle"], 2, 1300, 500, language=sp["language"]))
            db.add(r); await db.flush()
            await award_signup_bonus(db, r)
            await award_referral_bonus(db, anchor_b, r)
        await db.commit()
        log.info("30 referrals -> %s", anchor_b.full_name)

        # 7 standalone riders (no referrals)
        for sp in specs[2:5] + specs[8:11]:
            r = Rider(referral_code=await generate_unique_code(db),
                      **_make_rider_payload(
                          sp["name"], next_phone(), sp["city"], sp["platform"],
                          sp["vehicle"], 1, 1100, 400, language=sp["language"]))
            db.add(r); await db.flush()
            await award_signup_bonus(db, r)
        await db.commit()
        log.info("7 standalone riders created")

        # Recompute segments
        all_riders = (await db.execute(select(Rider))).scalars().all()
        for r in all_riders:
            r.segments = compute_segments({
                "vehicle_type": r.vehicle_type, "open_to_switch": r.open_to_switch,
                "has_accident_insurance": r.has_accident_insurance,
                "has_health_insurance": r.has_health_insurance,
                "paid_out_of_pocket": r.paid_out_of_pocket,
                "interested_in": r.interested_in or [],
                "weekly_expense": r.weekly_expense,
                "monthly_maintenance": r.monthly_maintenance,
                "years_experience": r.years_experience,
            })
        await db.commit()
        log.info("Computed segments for %d riders", len(all_riders))
        log.info("Seed complete: %d riders, 1 admin", len(all_riders))


def _spec(i: int, city: str, platform: str, vehicle: str, lang: str) -> dict[str, Any]:
    return {"name": f"{city[:3].upper()}-{vehicle[:3]}-{i+1}",
            "city": city, "platform": platform, "vehicle": vehicle, "language": lang}


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed Road Warrior database")
    parser.add_argument("--reset", action="store_true", help="Wipe all data first")
    args = parser.parse_args()
    asyncio.run(seed(reset=args.reset))


if __name__ == "__main__":
    main()
