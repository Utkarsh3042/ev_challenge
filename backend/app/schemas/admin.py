"""Schemas for the admin dashboard endpoints."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---------- Auth -------------------------------------------------------------
class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class AdminLoginResponse(BaseModel):
    success: bool = True
    admin_id: uuid.UUID
    email: EmailStr


class AdminMeResponse(BaseModel):
    admin_id: uuid.UUID
    email: EmailStr
    last_login_at: datetime | None = None


# ---------- Stats ------------------------------------------------------------
class DayCount(BaseModel):
    date: str = Field(..., description="YYYY-MM-DD")
    count: int


class StatsResponse(BaseModel):
    total_riders: int
    total_points_awarded: int
    active_referrers: int
    hot_ev_leads: int
    insurance_leads: int
    retrofit_leads: int
    by_vehicle_type: dict[str, int]
    by_city: dict[str, int]
    by_platform: dict[str, int]
    by_language: dict[str, int]
    signups_per_day: list[DayCount]


# ---------- Rider listing (admin view) ---------------------------------------
class RiderListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    full_name: str
    phone: str
    city: str
    platform: str
    vehicle_type: str
    preferred_language: str
    points: int
    referral_count: int
    referral_code: str
    is_duplicate: bool
    source: str
    created_at: datetime
    segments: list[str]


class RiderDetail(RiderListItem):
    years_experience: int
    vehicle_brand_model: str | None
    fuel_method: str
    weekly_expense: int
    monthly_maintenance: int
    top_challenges: list[str]
    ev_challenges: list[str]
    petrol_challenges: list[str]
    has_accident_insurance: str
    has_health_insurance: str
    paid_out_of_pocket: bool
    open_to_switch: str
    switch_motivators: list[str]
    interested_in: list[str]
    referred_by_code: str | None
    milestone_10_reached: bool
    milestone_25_reached: bool
    milestone_50_reached: bool
    updated_at: datetime
    notes: str | None


# ---------- Leaderboard -------------------------------------------------------
class LeaderboardEntry(BaseModel):
    rank: int
    rider_id: uuid.UUID
    full_name: str
    city: str
    points: int
    referral_count: int
    milestones_reached: list[str]


# ---------- Segment listing --------------------------------------------------
class SegmentListResponse(BaseModel):
    segment: str
    total: int
    riders: list[RiderListItem]
