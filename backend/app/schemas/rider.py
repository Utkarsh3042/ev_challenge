"""Schemas for the public rider-facing endpoints."""

from __future__ import annotations

import re
import uuid
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

# ---------- Enumerations (kept narrow to control data quality) ----------------
City = Literal[
    "Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Pune", "Other",
]
Platform = Literal["swiggy", "zomato", "blinkit", "porter", "dunzo", "rapido", "other"]
VehicleType = Literal["petrol", "diesel", "electric", "other"]
FuelMethod = Literal["petrol_pump", "home_charging", "battery_swap", "other"]
Language = Literal["en", "hi", "kn"]
InsuranceAnswer = Literal["yes", "no", "not_sure"]
SwitchIntent = Literal["yes", "no", "already_ev", "need_info"]


# ---------- OTP Request (standalone, must be defined before RiderSubmit) ------
class SendOTPRequest(BaseModel):
    """Payload of POST /api/riders/send-otp."""
    phone: str

    @field_validator("phone")
    @classmethod
    def _validate_phone(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v)
        if len(digits) == 10 and not re.match(r"^[6-9]\d{9}$", digits):
            raise ValueError("Invalid Indian mobile number")
        if len(digits) > 10 and not re.match(r"^[6-9]\d{9}$", digits[-10:]):
            raise ValueError("Invalid Indian mobile number")
        return v


# ---------- Input: survey submission -----------------------------------------
class RiderSubmit(BaseModel):
    """Payload of POST /api/riders/submit."""

    model_config = ConfigDict(extra="forbid")

    # Personal
    full_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(
        min_length=10, max_length=15, description="Indian mobile, raw or E.164",
    )
    pin_code: str = Field(min_length=6, max_length=6, default="000000")
    city: City
    platform: Platform
    platforms: list[Platform] = Field(default_factory=list)
    years_experience: int = Field(ge=0, le=50)
    preferred_language: Language = "en"

    # Vehicle
    vehicle_type: VehicleType
    vehicle_brand_model: str | None = Field(default=None, max_length=100)
    fuel_method: FuelMethod
    weekly_expense: int = Field(ge=0, le=100_000, description="₹ per week")
    monthly_maintenance: int = Field(ge=0, le=100_000, description="₹ per month")

    # Challenges (free-text tags chosen by the user)
    top_challenges: list[str] = Field(default_factory=list, max_length=3)
    ev_challenges: list[str] = Field(default_factory=list, max_length=10)
    petrol_challenges: list[str] = Field(default_factory=list, max_length=10)

    # Insurance
    has_accident_insurance: InsuranceAnswer
    has_health_insurance: InsuranceAnswer
    paid_out_of_pocket: bool

    # EV intent
    open_to_switch: SwitchIntent
    switch_motivators: list[str] = Field(default_factory=list, max_length=10)
    interested_in: list[str] = Field(default_factory=list, max_length=10)

    # Referral (optional)
    referred_by_code: str | None = Field(default=None, max_length=20)

    # Security
    recaptcha_token: str = Field(min_length=10)
    website: str | None = Field(default=None, description="Honeypot field")
    otp: str = Field(min_length=4, max_length=6, description="OTP code")

    @field_validator("phone")
    @classmethod
    def _validate_phone(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v)
        if len(digits) == 10 and not re.match(r"^[6-9]\d{9}$", digits):
            raise ValueError("Invalid Indian mobile number")
        if len(digits) > 10 and not re.match(r"^[6-9]\d{9}$", digits[-10:]):
            raise ValueError("Invalid Indian mobile number")
        return v

    @field_validator("top_challenges", "ev_challenges", "petrol_challenges",
                     "switch_motivators", "interested_in", mode="before")
    @classmethod
    def _dedupe(cls, v: list[str] | None) -> list[str]:
        """Dedupe while preserving order; drop empties."""
        if not v:
            return []
        seen: set[str] = set()
        out: list[str] = []
        for item in v:
            if not isinstance(item, str):
                continue
            s = item.strip()
            if s and s not in seen:
                seen.add(s)
                out.append(s)
        return out


# ---------- Output: survey submission ----------------------------------------
class MilestoneProgress(BaseModel):
    target: int = Field(..., description="Referrals needed for this milestone")
    current: int
    points_bonus: int
    reached: bool


class RiderSubmitResponse(BaseModel):
    success: bool
    rider_id: uuid.UUID
    referral_code: str
    points: int
    segments: list[str]
    whatsapp_sent: bool
    whatsapp_preview: str
    is_duplicate: bool = False


# ---------- Output: score lookup ---------------------------------------------
class ScoreResponse(BaseModel):
    found: bool
    name: str | None = None
    referral_code: str | None = None
    points: int = 0
    referral_count: int = 0
    rank: int = 0
    total_riders: int = 0
    next_milestone: MilestoneProgress | None = None
    share_url: str = ""
    milestones_reached: list[str] = Field(default_factory=list)


# ---------- Output: referral code validation ---------------------------------
class ReferralValidation(BaseModel):
    valid: bool
    referrer_name: str | None = None
    referrer_city: str | None = None
