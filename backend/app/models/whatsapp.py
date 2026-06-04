"""WhatsAppMessage — log of every inbound and outbound WhatsApp message."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.base import Base, UUIDPrimaryKeyMixin


class WhatsAppMessage(Base, UUIDPrimaryKeyMixin):
    """One row per WhatsApp message exchanged with a rider.

    ``direction`` is either ``"inbound"`` or ``"outbound"``;
    ``status`` tracks Twilio's delivery state (queued, sent, delivered, failed, read).
    """

    __tablename__ = "whatsapp_messages"
    __table_args__ = (
        Index("idx_wm_phone", "phone"),
        Index("idx_wm_rider_id", "rider_id"),
        Index("idx_wm_sent_at", "sent_at"),
    )

    rider_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("riders.id", ondelete="SET NULL"),
        nullable=True,
    )
    phone: Mapped[str] = mapped_column(String(15), nullable=False)
    direction: Mapped[str] = mapped_column(String(10), nullable=False)
    template: Mapped[str | None] = mapped_column(String(50), nullable=True)
    language: Mapped[str | None] = mapped_column(String(5), nullable=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="queued", server_default="queued"
    )
    twilio_sid: Mapped[str | None] = mapped_column(String(50), nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<WhatsAppMessage {self.direction} {self.phone} status={self.status}>"
