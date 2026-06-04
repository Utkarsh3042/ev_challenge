"""Meta endpoints: static options, cities, locale JSONs, public summary."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import func as sql_func, select

from app.api.deps import DbSession
from app.models import Rider
from app.services.i18n import SUPPORTED_LANGUAGES, load_locale

router = APIRouter(tags=["meta"])

# Static enums (kept in sync with app/schemas/rider.py Literals)
CITIES: list[str] = [
    "Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Pune", "Other",
]
PLATFORMS: list[str] = [
    "swiggy", "zomato", "blinkit", "porter", "dunzo", "rapido", "other",
]
VEHICLE_TYPES: list[str] = ["petrol", "diesel", "electric", "other"]
FUEL_METHODS: list[str] = ["petrol_pump", "home_charging", "battery_swap", "other"]
LANGUAGES: list[str] = list(SUPPORTED_LANGUAGES)

# Common challenges the UI shows as multi-select chips
TOP_CHALLENGES: list[str] = [
    "high_fuel_cost", "maintenance", "range_anxiety", "charging_time",
    "breakdown_fear", "earnings_too_low", "no_insurance", "health_issues",
    "accident_risk", "long_hours", "weather", "pollution",
]
EV_CHALLENGES: list[str] = [
    "high_upfront_cost", "no_charging_nearby", "range_anxiety",
    "battery_replacement_cost", "long_charging_time", "unknown_brand",
    "resale_value", "service_centers_far",
]
PETROL_CHALLENGES: list[str] = [
    "fuel_price_volatility", "high_fuel_cost", "engine_maintenance",
    "emissions_guilt", "petrol_pump_distance", "noisy_engine",
]
SWITCH_MOTIVATORS: list[str] = [
    "save_money", "save_environment", "less_maintenance",
    "company_offers", "peer_pressure", "government_subsidy",
]
INTERESTED_IN: list[str] = [
    "ev_purchase", "ev_rental", "battery_swap", "retrofit",
    "charging_setup", "subsidies", "financing", "insurance",
]
SWITCH_INTENT: list[str] = ["yes", "no", "already_ev", "need_info"]
INSURANCE_ANSWERS: list[str] = ["yes", "no", "not_sure"]


@router.get("/locales/{lang}", summary="Translation JSON for one language")
async def get_locale(lang: str) -> JSONResponse:
    if lang not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=404, detail={"code": "NOT_FOUND", "message": f"Unknown language: {lang}"},
        )
    return JSONResponse(content=load_locale(lang))


@router.get("/meta/cities", summary="List of supported cities")
async def get_cities() -> list[str]:
    return CITIES


@router.get("/meta/options", summary="All static form options in one payload")
async def get_options() -> dict:
    return {
        "cities": CITIES,
        "platforms": PLATFORMS,
        "vehicle_types": VEHICLE_TYPES,
        "fuel_methods": FUEL_METHODS,
        "languages": LANGUAGES,
        "switch_intent": SWITCH_INTENT,
        "insurance_answers": INSURANCE_ANSWERS,
        "challenges": {
            "top": TOP_CHALLENGES,
            "ev": EV_CHALLENGES,
            "petrol": PETROL_CHALLENGES,
        },
        "motivators": SWITCH_MOTIVATORS,
        "interested_in": INTERESTED_IN,
    }


@router.get(
    "/meta/stats/summary",
    summary="Public, rider-safe summary numbers (used by the landing page)",
)
async def get_public_stats_summary(db: DbSession) -> dict:
    """Return just the two non-sensitive numbers used on the landing page.

    Kept intentionally small and unauthenticated so the public marketing
    page can render without an admin token.
    """
    total_riders = (await db.scalar(select(sql_func.count(Rider.id)))) or 0
    total_points = (await db.scalar(
        select(sql_func.coalesce(sql_func.sum(Rider.points), 0))
    )) or 0
    return {
        "total_riders": int(total_riders),
        "total_points_awarded": int(total_points),
    }
