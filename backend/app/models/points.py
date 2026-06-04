"""PointsTransaction — append-only ledger of every points change for a rider."""

from __future__ import annotations

from sqlalchemy import ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class PointsTransaction(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Audit log entry for a change in a rider's point balance.

    The ``rider_id`` FK cascades on delete; ``related_rider_id`` (used to
    record the *referrer* when the type is e.g. ``referral_bonus``) is
    set to NULL on delete.
    """

    __tablename__ = "points_transactions"
    __table_args__ = (
        Index("idx_pts_rider_id", "rider_id"),
        Index("idx_pts_created_at", "created_at"),
    )

    rider_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("riders.id", ondelete="CASCADE"),
        nullable=False,
    )
    type: Mapped[str] = mapped_column(String(30), nullable=False)
    points_delta: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    related_rider_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("riders.id", ondelete="SET NULL"),
        nullable=True,
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<PointsTransaction rider={self.rider_id} delta={self.points_delta}>"
