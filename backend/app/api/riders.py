"""Public rider-facing endpoints: submit, score, QR, validate-referral."""

from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, HTTPException, Query, status, Request
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
import httpx

from app.api.deps import DbSession, DispatcherDep
from app.config import settings
from app.models import Rider
from app.schemas.rider import (
    MilestoneProgress,
    ReferralValidation,
    RiderSubmit,
    RiderSubmitResponse,
    ScoreResponse,
    SendOTPRequest,
)
from app.services.phone import format_display, normalize as phone_normalize, validate as phone_validate
from app.services.sms import send_otp as send_sms_otp
import random
import time

# Simple in-memory OTP store. For production use Redis.
otp_store: dict[str, tuple[str, float]] = {}
from app.services.qr_service import build_share_url, generate_qr_png
from app.services.telegram_bot import send_notification
from app.services.referral import (
    award_referral_bonus,
    award_signup_bonus,
    find_referrer,
    generate_unique_code,
    get_rank_and_total,
)
from app.services.segments import compute_segments
from app.services.whatsapp_dispatcher import MessageResult

logger = logging.getLogger("road_warrior.riders")
router = APIRouter(tags=["riders"])


def _share_url_for(code: str) -> str:
    return build_share_url(code, settings.frontend_base_url)


# ---------- POST /api/riders/send-otp --------------------------------------
@router.post("/riders/send-otp", summary="Send an OTP to the rider's phone")
async def send_otp_endpoint(req: SendOTPRequest):
    try:
        e164 = phone_normalize(req.phone)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid phone number")
    
    otp = str(random.randint(100000, 999999))
    otp_store[e164] = (otp, time.time())
    
    success = await send_sms_otp(e164, otp)
    if not success:
        # Fallback for dev if fast2sms fails but we want to continue
        logger.warning(f"Failed to send SMS to {e164}, OTP was {otp}")
    
    return {"success": True}

# ---------- POST /api/riders/submit ----------------------------------------
@router.post(
    "/riders/submit",
    response_model=RiderSubmitResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit the survey and create a rider",
)
async def submit_rider(
    request: Request,
    payload: RiderSubmit,
    db: DbSession,
    dispatcher: DispatcherDep,
) -> RiderSubmitResponse:
    """End-to-end submit flow (see PR #2 spec for the full diagram)."""
    # 0) Security: Honeypot & reCAPTCHA
    if payload.website:
        logger.warning("Honeypot triggered for %s", payload.phone)
        return RiderSubmitResponse(
            success=True,
            rider_id=uuid.uuid4(),
            referral_code="FAKE123",
            points=10,
            segments=[],
            whatsapp_sent=False,
            whatsapp_preview="",
            is_duplicate=False,
        )

    if settings.recaptcha_secret_key:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://www.google.com/recaptcha/api/siteverify",
                data={
                    "secret": settings.recaptcha_secret_key,
                    "response": payload.recaptcha_token,
                },
            )
            data = resp.json()
            if not data.get("success") or data.get("score", 0) < 0.5:
                logger.warning("reCAPTCHA failed: %s", data)
                raise HTTPException(status_code=400, detail="reCAPTCHA verification failed")
    # 1) Normalize & validate phone
    try:
        e164_phone = phone_normalize(payload.phone)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "VALIDATION_ERROR", "message": str(exc), "field": "phone"},
        ) from exc
    if not phone_validate(e164_phone):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "VALIDATION_ERROR", "message": "Invalid phone number", "field": "phone"},
        )

    # 1.5) Validate OTP
    stored_otp, timestamp = otp_store.get(e164_phone, (None, 0))
    if not stored_otp or stored_otp != payload.otp:
        # If no OTP in store, maybe it expired or was never sent
        raise HTTPException(status_code=400, detail="Invalid or missing OTP")
    if time.time() - timestamp > 600:
        raise HTTPException(status_code=400, detail="OTP expired")
    
    # Clear OTP
    del otp_store[e164_phone]

    # 2) Duplicate handling
    existing = await db.scalar(select(Rider).where(Rider.phone == e164_phone))
    if existing is not None:
        existing.is_duplicate = True
        await db.flush()
        wa_result = await dispatcher.send_generic(
            db, existing.phone,
            f"You already registered on Road Warrior. Your code is {existing.referral_code}.",
        )
        await db.commit()
        return RiderSubmitResponse(
            success=True,
            rider_id=existing.id,
            referral_code=existing.referral_code,
            points=existing.points,
            segments=existing.segments or [],
            whatsapp_sent=wa_result.success,
            whatsapp_preview=wa_result.body,
            is_duplicate=True,
        )

    # 3) Referral lookup (ignore invalid codes per spec)
    referrer = None
    if payload.referred_by_code:
        referrer = await find_referrer(db, payload.referred_by_code)
        if referrer is None:
            logger.warning("Unknown referral code ignored: %s", payload.referred_by_code)

    # 4) Generate unique code + compute segments
    referral_code = await generate_unique_code(db)
    segments = compute_segments(payload.model_dump())

    # 5) Create the rider (points=10 from DB default)
    rider = Rider(
        full_name=payload.full_name,
        phone=e164_phone,
        city=payload.city,
        platform=payload.platform,
        years_experience=payload.years_experience,
        preferred_language=payload.preferred_language,
        vehicle_type=payload.vehicle_type,
        vehicle_brand_model=payload.vehicle_brand_model,
        fuel_method=payload.fuel_method,
        weekly_expense=payload.weekly_expense,
        monthly_maintenance=payload.monthly_maintenance,
        top_challenges=payload.top_challenges,
        ev_challenges=payload.ev_challenges,
        petrol_challenges=payload.petrol_challenges,
        has_accident_insurance=payload.has_accident_insurance,
        has_health_insurance=payload.has_health_insurance,
        paid_out_of_pocket=payload.paid_out_of_pocket,
        open_to_switch=payload.open_to_switch,
        switch_motivators=payload.switch_motivators,
        interested_in=payload.interested_in,
        referred_by_code=referrer.referral_code if referrer else None,
        referral_code=referral_code,
        segments=segments,
        source="web",
    )
    db.add(rider)
    try:
        await db.flush()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "CONFLICT", "message": "Phone or referral code collision"},
        ) from exc

    # 6) Signup audit row
    await award_signup_bonus(db, rider)
    await db.flush()
    await db.refresh(rider)

    # 7) Welcome WhatsApp (best effort)
    wa_result: MessageResult = await dispatcher.send_welcome(db, rider)

    # 8) Referrer bonus + milestones
    if referrer is not None and referrer.id != rider.id:
        award = await award_referral_bonus(db, referrer, rider)
        for ms in award.triggered_milestones:
            await dispatcher.send_milestone(db, referrer, ms)
        
        if referrer.telegram_chat_id:
            msg = f"🎉 Great news, {referrer.full_name}! Someone just signed up using your link. You earned points!\n\nNew Balance: {award.new_points} ⚡"
            import asyncio
            asyncio.create_task(send_notification(referrer.telegram_chat_id, msg))

        await db.flush()
        await db.refresh(referrer)

    await db.commit()
    await db.refresh(rider)

    return RiderSubmitResponse(
        success=True,
        rider_id=rider.id,
        referral_code=rider.referral_code,
        points=rider.points,
        segments=rider.segments or [],
        whatsapp_sent=wa_result.success,
        whatsapp_preview=wa_result.body,
        is_duplicate=False,
    )


# ---------- GET /api/riders/score ------------------------------------------
@router.get(
    "/riders/score",
    response_model=ScoreResponse,
    summary="Look up a rider's score, rank, and next milestone",
)
async def get_score(
    db: DbSession,
    phone: str = Query(..., description="Rider's phone, raw or E.164"),
) -> ScoreResponse:
    try:
        e164 = phone_normalize(phone)
    except ValueError:
        return ScoreResponse(found=False, share_url="")
    rider = await db.scalar(select(Rider).where(Rider.phone == e164))
    if not rider:
        return ScoreResponse(found=False, share_url="")

    rank, total = await get_rank_and_total(db, rider.points)
    reached: list[str] = []
    if rider.milestone_10_reached:
        reached.append("10_referrals")
    if rider.milestone_25_reached:
        reached.append("25_referrals")
    if rider.milestone_50_reached:
        reached.append("50_referrals")

    next_ms: MilestoneProgress | None = None
    for target, bonus, flag in (
        (settings.milestone_10_referrals, settings.milestone_10_bonus, rider.milestone_10_reached),
        (settings.milestone_25_referrals, settings.milestone_25_bonus, rider.milestone_25_reached),
        (settings.milestone_50_referrals, settings.milestone_50_bonus, rider.milestone_50_reached),
    ):
        if not flag:
            next_ms = MilestoneProgress(
                target=target,
                current=rider.referral_count,
                points_bonus=bonus,
                reached=False,
            )
            break

    return ScoreResponse(
        found=True,
        name=rider.full_name,
        referral_code=rider.referral_code,
        points=rider.points,
        referral_count=rider.referral_count,
        rank=rank,
        total_riders=total,
        next_milestone=next_ms,
        share_url=_share_url_for(rider.referral_code),
        milestones_reached=reached,
    )


# ---------- GET /api/riders/qr/{code}.png ----------------------------------
@router.get(
    "/riders/qr/{code}.png",
    summary="PNG QR code embedding the rider's share URL",
    response_class=Response,
    responses={200: {"content": {"image/png": {}}}, 404: {"description": "Code not found"}},
)
async def get_qr_png(
    code: str,
    db: DbSession,
) -> Response:
    if code.endswith(".png"):
        raw_code = code[:-4]
    else:
        raw_code = code
    if not raw_code:
        raise HTTPException(status_code=400, detail="Empty code")
    rider = await db.scalar(select(Rider.referral_code).where(Rider.referral_code == raw_code))
    if not rider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Unknown referral code"},
        )
    png_bytes = generate_qr_png(_share_url_for(raw_code))
    return Response(content=png_bytes, media_type="image/png")


# ---------- GET /api/riders/validate-referral/{code} -----------------------
@router.get(
    "/riders/validate-referral/{code}",
    response_model=ReferralValidation,
    summary="Check if a referral code is valid (used by the form for live feedback)",
)
async def validate_referral(code: str, db: DbSession) -> ReferralValidation:
    row = await db.execute(
        select(Rider.full_name, Rider.city).where(Rider.referral_code == code)
    )
    result = row.first()
    if not result:
        return ReferralValidation(valid=False)
    name, city = result
    return ReferralValidation(valid=True, referrer_name=name, referrer_city=city)
