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
    tags: set[str] = set()

    has_acc = (answers.get("has_accident_insurance") or "").lower()
    has_health = (answers.get("has_health_insurance") or "").lower()
    interested_in: list[str] = answers.get("interested_in") or []
    interested_set = {x.lower() for x in interested_in}

    if has_health == "no":
        tags.add("PERSONAL_INSURANCE_LEAD")
    if has_acc == "no":
        tags.add("BIKE_INSURANCE_LEAD")
    
    if "ev_purchase" in interested_set:
        tags.add("EV_SALE_LEAD")
    if "ev_rental" in interested_set:
        tags.add("EV_RENTAL_LEAD")
    if "retrofit" in interested_set:
        tags.add("RETROFIT_LEAD")
    if any(x in interested_set for x in ["battery_swap", "charging_setup", "subsidies", "financing", "insurance", "other"]):
        tags.add("PRODUCT_LEAD")

    return sorted(tags)
