"""CSV export helpers for the admin dashboard."""

from __future__ import annotations

import csv
import io
from collections.abc import AsyncIterator
from typing import Any

from app.models import Rider

# Column order in the export — stable, human-readable, matches what the
# admin wants to open in a spreadsheet.
EXPORT_COLUMNS: list[str] = [
    "id", "full_name", "phone", "city", "platform", "preferred_language",
    "years_experience", "vehicle_type", "vehicle_brand_model", "fuel_method",
    "weekly_expense", "monthly_maintenance",
    "has_accident_insurance", "has_health_insurance", "paid_out_of_pocket",
    "open_to_switch",
    "points", "referral_count", "referral_code", "referred_by_code",
    "milestone_10_reached", "milestone_25_reached", "milestone_50_reached",
    "is_duplicate", "source", "segments", "notes",
    "created_at", "updated_at",
]


def _to_csv_value(value: Any) -> str:
    """Format one cell for CSV. Lists join with ``;``; everything else as str."""
    if value is None:
        return ""
    if isinstance(value, list):
        return ";".join(str(x) for x in value)
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)


def riders_to_csv(riders: list[Rider]) -> str:
    """Return a CSV string for a list of riders (header + rows)."""
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=EXPORT_COLUMNS, quoting=csv.QUOTE_MINIMAL)
    writer.writeheader()
    for r in riders:
        row = {col: _to_csv_value(getattr(r, col, None)) for col in EXPORT_COLUMNS}
        writer.writerow(row)
    return buf.getvalue()


async def riders_to_csv_stream(riders: list[Rider]) -> AsyncIterator[bytes]:
    """Yield CSV as UTF-8-encoded byte chunks (header + each row).

    Kept as an async generator to match the FastAPI ``StreamingResponse``
    signature, even though the work is sync under the hood — for the
    MVP dataset (thousands of rows) this is plenty fast.
    """
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=EXPORT_COLUMNS, quoting=csv.QUOTE_MINIMAL)
    writer.writeheader()
    yield buf.getvalue().encode("utf-8")
    buf.seek(0)
    buf.truncate(0)

    for r in riders:
        row = {col: _to_csv_value(getattr(r, col, None)) for col in EXPORT_COLUMNS}
        writer.writerow(row)
        yield buf.getvalue().encode("utf-8")
        buf.seek(0)
        buf.truncate(0)
