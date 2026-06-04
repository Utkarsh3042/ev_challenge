"""Auto-tagging: compute segment tags from a rider's survey answers.

Segments are stored as a ``TEXT[]`` on the rider and indexed with a GIN
index, so admin filters like ``segments @> ARRAY['hot_ev_lead']`` are fast.

This module is a *pure* function (no DB, no I/O) — it takes the same data
shape as ``RiderSubmit`` and returns the sorted list of segment tags.
That makes it trivial to unit-test every branch.
"""

from __future__ import annotations

from typing import Any


def compute_segments(answers: dict[str, Any]) -> list[str]:
    """Return a sorted list of segment tags for the given answers.

    Args:
        answers: dict matching ``RiderSubmit`` field names. Unknown keys
            are ignored, so callers can pass ``RiderSubmit.model_dump()``
            or a subset during testing.
    """
    tags: set[str] = set()

    vehicle = (answers.get("vehicle_type") or "").lower()
    open_to = (answers.get("open_to_switch") or "").lower()
    interested_in: list[str] = answers.get("interested_in") or []
    interested_set = {x.lower() for x in interested_in}

    has_acc = (answers.get("has_accident_insurance") or "").lower()
    has_health = (answers.get("has_health_insurance") or "").lower()
    paid_oop = bool(answers.get("paid_out_of_pocket"))
    weekly = answers.get("weekly_expense") or 0
    monthly_maint = answers.get("monthly_maintenance") or 0
    years = answers.get("years_experience") or 0

    # ---------- Vehicle-based ----------
    if vehicle == "electric":
        tags.add("ev_rider")
    if vehicle in ("petrol", "diesel"):
        tags.add("petrol_rider")
    if vehicle == "diesel":
        tags.add("diesel_rider")

    # ---------- EV intent ----------
    if open_to in ("yes", "need_info"):
        tags.add("swing_rider")
    if vehicle in ("petrol", "diesel") and open_to == "yes":
        tags.add("hot_ev_lead")

    # ---------- Insurance ----------
    if has_acc == "no" or has_health == "no":
        tags.add("insurance_lead")
    if paid_oop:
        tags.add("accident_victim")

    # ---------- Product interest ----------
    if "retrofit" in interested_set:
        tags.add("retrofit_lead")
    if "ev_rental" in interested_set:
        tags.add("rental_lead")

    # ---------- Spend / experience ----------
    if weekly >= 1500 or monthly_maint >= 3000:
        tags.add("high_spender")
    if years >= 3:
        tags.add("veteran")

    return sorted(tags)
