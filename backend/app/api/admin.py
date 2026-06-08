"""Admin endpoints: login/logout/me, stats, riders, leaderboard, segments, export, messages."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, Response, status
from fastapi.responses import StreamingResponse
from sqlalchemy import desc, func as sql_func, or_, select
from sqlalchemy.dialects.postgresql import ARRAY

from app.api.deps import CurrentAdmin, DbSession
from app.auth.jwt import create_access_token
from app.auth.security import hash_password, verify_password
from app.config import settings
from app.models import Admin, Rider, WhatsAppMessage
from app.schemas.admin import (
    AdminLoginRequest,
    AdminLoginResponse,
    AdminMeResponse,
    LeaderboardEntry,
    RiderDetail,
    RiderListItem,
    SegmentListResponse,
    StatsResponse,
)
from app.services.export import riders_to_csv_stream
from app.services.stats import get_dashboard_stats

router = APIRouter(prefix="/admin", tags=["admin"])

# Convenience: use ARRAY.contains() for GIN-indexed segment filtering
_segments_col = Rider.__table__.c["segments"]


# ---------- Auth -----------------------------------------------------------
@router.post("/login", response_model=AdminLoginResponse)
async def login(payload: AdminLoginRequest, db: DbSession) -> Response:
    admin = await db.scalar(
        select(Admin).where(Admin.email == payload.email, Admin.is_active.is_(True))
    )
    if not admin or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Invalid email or password"},
        )
    admin.last_login_at = datetime.now(tz=timezone.utc)
    token = create_access_token(admin.id, email=admin.email)
    await db.commit()

    body = AdminLoginResponse(
        success=True, admin_id=admin.id, email=admin.email,
    ).model_dump(mode="json")
    resp = Response(content=json.dumps(body), media_type="application/json")
    resp.set_cookie(
        key="admin_token", value=token, httponly=True,
        secure=settings.is_production, samesite="lax",
        max_age=settings.jwt_expires_min * 60,
    )
    return resp


@router.post("/logout")
async def logout() -> Response:
    resp = Response(
        content='{"success":true}', media_type="application/json", status_code=200,
    )
    resp.delete_cookie("admin_token")
    return resp


@router.get("/me", response_model=AdminMeResponse)
async def me(admin: CurrentAdmin) -> AdminMeResponse:
    return AdminMeResponse(
        admin_id=admin.id, email=admin.email, last_login_at=admin.last_login_at,
    )


# ---------- Stats ----------------------------------------------------------
@router.get("/stats", response_model=StatsResponse)
async def stats(_: CurrentAdmin, db: DbSession) -> StatsResponse:
    return await get_dashboard_stats(db)


# ---------- Riders list & detail -------------------------------------------
@router.get("/riders", response_model=list[RiderListItem])
async def list_riders(
    _: CurrentAdmin,
    db: DbSession,
    city: str | None = None,
    vehicle: str | None = None,
    platform: str | None = None,
    language: str | None = None,
    segment: str | None = None,
    pin_code: str | None = None,
    follow_up_flag: bool | None = None,
    q: str | None = Query(None, description="Search by name or phone"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> list[RiderListItem]:
    stmt = select(Rider)
    if city:
        stmt = stmt.where(Rider.city == city)
    if vehicle:
        stmt = stmt.where(Rider.vehicle_type == vehicle)
    if platform:
        stmt = stmt.where(Rider.platform == platform)
    if language:
        stmt = stmt.where(Rider.preferred_language == language)
    if segment:
        stmt = stmt.where(_segments_col.contains([segment]))
    if pin_code:
        stmt = stmt.where(Rider.pin_code == pin_code)
    if follow_up_flag is not None:
        stmt = stmt.where(Rider.follow_up_flag == follow_up_flag)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(Rider.full_name.ilike(like), Rider.phone.ilike(like)))
    stmt = stmt.order_by(desc(Rider.created_at)).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(stmt)).scalars().all()
    return [RiderListItem.model_validate(r) for r in rows]


@router.get("/riders/{rider_id}", response_model=RiderDetail)
async def get_rider(rider_id: uuid.UUID, _: CurrentAdmin, db: DbSession) -> RiderDetail:
    r = await db.get(Rider, rider_id)
    if not r:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Rider not found"},
        )
    return RiderDetail.model_validate(r)


# ---------- Leaderboard -----------------------------------------------------
@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def leaderboard(
    _: CurrentAdmin, db: DbSession,
    limit: int = Query(20, ge=1, le=100),
) -> list[LeaderboardEntry]:
    rows = (await db.execute(
        select(Rider).order_by(desc(Rider.referral_count), desc(Rider.points)).limit(limit)
    )).scalars().all()
    entries: list[LeaderboardEntry] = []
    for i, r in enumerate(rows, start=1):
        reached: list[str] = []
        if r.milestone_10_reached:
            reached.append("10_referrals")
        if r.milestone_25_reached:
            reached.append("25_referrals")
        if r.milestone_50_reached:
            reached.append("50_referrals")
        entries.append(LeaderboardEntry(
            rank=i, rider_id=r.id, full_name=r.full_name, city=r.city,
            points=r.points, referral_count=r.referral_count, milestones_reached=reached,
        ))
    return entries


# ---------- Segments --------------------------------------------------------
@router.get("/segments/{name}", response_model=SegmentListResponse)
async def list_segment(
    name: str, _: CurrentAdmin, db: DbSession,
    page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=200),
) -> SegmentListResponse:
    base_where = _segments_col.contains([name])
    total = (await db.scalar(select(sql_func.count(Rider.id)).where(base_where))) or 0
    stmt = (
        select(Rider).where(base_where)
        .order_by(desc(Rider.created_at))
        .offset((page - 1) * page_size).limit(page_size)
    )
    rows = (await db.execute(stmt)).scalars().all()
    return SegmentListResponse(
        segment=name, total=int(total),
        riders=[RiderListItem.model_validate(r) for r in rows],
    )


# ---------- Export ----------------------------------------------------------
@router.get("/export")
async def export_riders(
    _: CurrentAdmin, db: DbSession,
    city: str | None = None, vehicle: str | None = None,
    segment: str | None = None, pin_code: str | None = None,
    follow_up_flag: bool | None = None,
) -> StreamingResponse:
    stmt = select(Rider).order_by(desc(Rider.created_at))
    if city:
        stmt = stmt.where(Rider.city == city)
    if vehicle:
        stmt = stmt.where(Rider.vehicle_type == vehicle)
    if segment:
        stmt = stmt.where(_segments_col.contains([segment]))
    if pin_code:
        stmt = stmt.where(Rider.pin_code == pin_code)
    if follow_up_flag is not None:
        stmt = stmt.where(Rider.follow_up_flag == follow_up_flag)
    rows = (await db.execute(stmt)).scalars().all()
    filename = f"riders_{datetime.now(tz=timezone.utc):%Y%m%d_%H%M%S}.csv"
    return StreamingResponse(
        riders_to_csv_stream(list(rows)),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ---------- Messages log ----------------------------------------------------
@router.get("/messages")
async def list_messages(
    _: CurrentAdmin, db: DbSession, limit: int = Query(50, ge=1, le=200),
) -> list[dict]:
    rows = (await db.execute(
        select(WhatsAppMessage).order_by(desc(WhatsAppMessage.sent_at)).limit(limit)
    )).scalars().all()
    return [
        {
            "id": str(m.id), "phone": m.phone, "direction": m.direction,
            "template": m.template, "language": m.language, "body": m.body,
            "status": m.status, "error": m.error, "sent_at": m.sent_at.isoformat(),
        }
        for m in rows
    ]
