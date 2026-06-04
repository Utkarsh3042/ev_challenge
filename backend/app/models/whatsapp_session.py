"""WhatsAppSession — stateful conversation context for the chatbot.

Keyed by phone (one active session per phone at a time). ``step`` is the
name of the current state in the conversation flow; ``partial_data``
holds the in-progress survey answers as JSONB so they survive restarts.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, String, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.base import Base


class WhatsAppSession(Base):
    """A rider's ongoing conversation with the WhatsApp bot."""

    __tablename__ = "whatsapp_sessions"

    phone: Mapped[str] = mapped_column(String(15), primary_key=True)
    step: Mapped[str] = mapped_column(String(50), nullable=False)
    partial_data: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )
    language: Mapped[str] = mapped_column(
        String(5), nullable=False, default="en", server_default="en"
    )
    last_active_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<WhatsAppSession phone={self.phone} step={self.step}>"

