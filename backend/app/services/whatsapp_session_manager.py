"""Session Manager for WhatsApp Chatbot."""
from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.whatsapp_session import WhatsAppSession


async def get_session(db: AsyncSession, phone: str) -> WhatsAppSession | None:
    """Retrieve an active session for the given phone number."""
    return await db.scalar(select(WhatsAppSession).where(WhatsAppSession.phone == phone))


async def create_session(
    db: AsyncSession, phone: str, step: str = "A_LANG", language: str = "en"
) -> WhatsAppSession:
    """Create a new chatbot session."""
    session = WhatsAppSession(
        phone=phone, step=step, language=language, partial_data={}
    )
    db.add(session)
    await db.flush()  # Let caller commit if part of larger transaction
    return session


async def update_session(
    db: AsyncSession,
    session: WhatsAppSession,
    step: str | None = None,
    partial_data: dict[str, Any] | None = None,
    language: str | None = None,
) -> WhatsAppSession:
    """Update a session's state and merge new partial data."""
    if step is not None:
        session.step = step
    if partial_data is not None:
        # Merge new data into existing dict
        session.partial_data = {**session.partial_data, **partial_data}
    if language is not None:
        session.language = language

    # last_active_at is auto-updated by SQLAlchemy onupdate
    await db.flush()
    return session


async def delete_session(db: AsyncSession, session: WhatsAppSession) -> None:
    """Delete a completed or abandoned session."""
    await db.delete(session)
    await db.flush()
