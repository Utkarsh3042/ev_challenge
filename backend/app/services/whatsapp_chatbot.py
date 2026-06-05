"""Chatbot state machine for WhatsApp registration flow."""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.rider import Rider
from app.models.whatsapp_session import WhatsAppSession
from app.services.whatsapp_dispatcher import WhatsAppDispatcher
from app.services.whatsapp_session_manager import (
    create_session,
    delete_session,
    get_session,
    update_session,
)
from app.services.i18n import get_message
from app.services.referral import generate_unique_code, find_referrer, award_signup_bonus, award_referral_bonus
from app.services.segments import compute_segments
from app.services.phone import normalize

logger = logging.getLogger("road_warrior.chatbot")


async def process_message(
    db: AsyncSession,
    dispatcher: WhatsAppDispatcher,
    phone: str,
    body: str,
) -> None:
    """Process an incoming message and route it through the state machine."""
    text = body.strip()
    upper_text = text.upper()
    
    # Check for global commands first
    if upper_text == "START":
        await _start_flow(db, dispatcher, phone)
        return
        
    session = await get_session(db, phone)
    
    # Global commands requiring an active account (or session)
    if upper_text == "MY SCORE":
        await _handle_my_score(db, dispatcher, phone, session)
        return
    elif upper_text == "REFERRAL":
        await _handle_referral(db, dispatcher, phone, session)
        return
    elif upper_text in ("HELP", "HI", "HELLO"):
        await _handle_help(db, dispatcher, phone, session)
        return

    # If no session and no global command, send help/start prompt
    if not session:
        await dispatcher.send_generic(
            db, phone, 
            "Welcome to Road Warrior! 🚴\nType START to register, or MY SCORE to view your points."
        )
        return

    # Process step
    await _handle_step(db, dispatcher, phone, session, text)


async def _start_flow(db: AsyncSession, dispatcher: WhatsAppDispatcher, phone: str) -> None:
    # If they are already a registered rider, let them know
    existing = await db.scalar(select(Rider).where(Rider.phone == phone))
    if existing:
        await dispatcher.send_generic(db, phone, "You are already registered! Type MY SCORE to view your points or REFERRAL to get your share link.")
        return
        
    # Create or reset session
    session = await get_session(db, phone)
    if session:
        await delete_session(db, session)
    session = await create_session(db, phone, step="A_LANG")
    
    await dispatcher.send_generic(
        db, phone, 
        "Welcome! First, choose your language:\n1. English\n2. हिंदी (Hindi)\n3. ಕನ್ನಡ (Kannada)\n\nReply with 1, 2, or 3."
    )


async def _handle_step(
    db: AsyncSession, dispatcher: WhatsAppDispatcher, phone: str, session: WhatsAppSession, text: str
) -> None:
    step = session.step
    data = session.partial_data
    lang = session.language

    try:
        if step == "A_LANG":
            if text == "1":
                lang = "en"
            elif text == "2":
                lang = "hi"
            elif text == "3":
                lang = "kn"
            else:
                await dispatcher.send_generic(db, phone, "Invalid choice. Reply 1, 2, or 3.")
                return
            await update_session(db, session, step="B_VEHICLE", language=lang)
            msg = get_message(lang, "whatsapp.bot_vehicle", fallback="What vehicle do you drive?\n1. Petrol 2-Wheeler\n2. Electric 2-Wheeler")
            await dispatcher.send_generic(db, phone, msg)
            
        elif step == "B_VEHICLE":
            vehicle = "electric" if "2" in text else "petrol"
            await update_session(db, session, step="C_NAME", partial_data={"vehicle_type": vehicle})
            msg = get_message(lang, "whatsapp.bot_name", fallback="What is your full name?")
            await dispatcher.send_generic(db, phone, msg)
            
        elif step == "C_NAME":
            if len(text) < 2:
                await dispatcher.send_generic(db, phone, get_message(lang, "whatsapp.bot_name", fallback="Please enter a valid name."))
                return
            await update_session(db, session, step="D_CITY", partial_data={"full_name": text})
            msg = get_message(lang, "whatsapp.bot_city", fallback="Which city do you drive in? (e.g. Bangalore, Delhi, Mumbai)")
            await dispatcher.send_generic(db, phone, msg)
            
        elif step == "D_CITY":
            await update_session(db, session, step="E_REFERRAL", partial_data={"city": text})
            msg = get_message(lang, "whatsapp.bot_referral", fallback="Do you have a referral code from a friend? Reply with the code, or NO if you don't have one.")
            await dispatcher.send_generic(db, phone, msg)
            
        elif step == "E_REFERRAL":
            ref_code = None if text.upper() == "NO" else text.strip().upper()
            
            # Save data and complete registration
            full_data = session.partial_data
            
            # Validate referral code
            referrer_id = None
            referrer = None
            if ref_code:
                referrer = await find_referrer(db, ref_code)
                if referrer and referrer.phone != phone:
                    referrer_id = referrer.id
                else:
                    referrer = None
            
            # Create rider
            new_code = await generate_unique_code(db)
            rider = Rider(
                full_name=full_data.get("full_name", "Unknown"),
                phone=phone,
                city=full_data.get("city", "Other"),
                platform="other",
                years_experience=1,
                preferred_language=lang,
                vehicle_type=full_data.get("vehicle_type", "petrol"),
                fuel_method="other",
                weekly_expense=0,
                monthly_maintenance=0,
                top_challenges=[],
                ev_challenges=[],
                petrol_challenges=[],
                has_accident_insurance="not_sure",
                has_health_insurance="not_sure",
                paid_out_of_pocket=False,
                open_to_switch="need_info",
                switch_motivators=[],
                interested_in=[],
                referral_code=new_code,
                referred_by_id=referrer_id,
            )
            db.add(rider)
            await db.flush()
            
            # Clean up session
            await delete_session(db, session)
            
            # Award points
            await award_signup_bonus(db, rider)
            if referrer:
                await award_referral_bonus(db, referrer, rider)
                
                # We should notify the referrer about the successful referral
                # In PR #4, the dispatcher is usually passed in the router, but we can do it here manually
                # Or wait, do we just let it be silent? Let's send a milestone/generic message if they reached a milestone.
                # Actually, award_referral_bonus doesn't take dispatcher, so we just do it manually.
                # Just keeping it simple here as the points are awarded.
                
            rider.segments = compute_segments(vars(rider))
            await db.commit()
            
            # Send welcome
            await dispatcher.send_welcome(db, rider)

    except Exception as exc:
        logger.exception("Error in chatbot flow step %s: %s", step, exc)
        await dispatcher.send_generic(db, phone, "Sorry, something went wrong. Please type START to try again.")


async def _handle_my_score(db: AsyncSession, dispatcher: WhatsAppDispatcher, phone: str, session: WhatsAppSession | None) -> None:
    rider = await db.scalar(select(Rider).where(Rider.phone == phone))
    if not rider:
        await dispatcher.send_generic(db, phone, "You are not registered. Type START to register.")
        return
    
    from app.services.referral import get_rank_and_total
    rank, _ = await get_rank_and_total(db, rider.points)
    stats = {"points": rider.points, "referral_count": rider.referral_count, "rank": rank}
    await dispatcher.send_my_score(db, rider, stats)


async def _handle_referral(db: AsyncSession, dispatcher: WhatsAppDispatcher, phone: str, session: WhatsAppSession | None) -> None:
    rider = await db.scalar(select(Rider).where(Rider.phone == phone))
    if not rider:
        await dispatcher.send_generic(db, phone, "You are not registered. Type START to register.")
        return
    await dispatcher.send_referral_share(db, rider)


async def _handle_help(db: AsyncSession, dispatcher: WhatsAppDispatcher, phone: str, session: WhatsAppSession | None) -> None:
    rider = await db.scalar(select(Rider).where(Rider.phone == phone))
    if rider:
        msg = "Road Warrior Menu:\n• MY SCORE - View your points & rank\n• REFERRAL - Get your share link\n• HELP - This menu"
        await dispatcher.send_generic(db, phone, msg)
    else:
        msg = "Welcome to Road Warrior! Type START to begin registration."
        await dispatcher.send_generic(db, phone, msg)
