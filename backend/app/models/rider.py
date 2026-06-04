"""Rider model — the central entity in the platform."""

from __future__ import annotations

from sqlalchemy import Boolean, CheckConstraint, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Rider(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """A delivery rider who has completed the survey (or was referred)."""

    __tablename__ = "riders"
    __table_args__ = (
        CheckConstraint(
            "years_experience >= 0 AND years_experience <= 50",
            name="ck_riders_years_experience_range",
        ),
        CheckConstraint("weekly_expense >= 0", name="ck_riders_weekly_expense_nonneg"),
        CheckConstraint(
            "monthly_maintenance >= 0", name="ck_riders_monthly_maintenance_nonneg"
        ),
        CheckConstraint("points >= 0", name="ck_riders_points_nonneg"),
        CheckConstraint("referral_count >= 0", name="ck_riders_referral_count_nonneg"),
        Index("idx_riders_phone", "phone"),
        Index("idx_riders_referral_code", "referral_code"),
        Index("idx_riders_city", "city"),
        Index("idx_riders_vehicle_type", "vehicle_type"),
        Index("idx_riders_created_at", "created_at"),
        Index("idx_riders_points", "points"),
        Index("idx_riders_referral_count", "referral_count"),
    )

    # ---------- Personal ----------
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(15), unique=True, nullable=False)
    city: Mapped[str] = mapped_column(String(50), nullable=False)
    platform: Mapped[str] = mapped_column(String(20), nullable=False)
    years_experience: Mapped[int] = mapped_column(Integer, nullable=False)
    preferred_language: Mapped[str] = mapped_column(
        String(5), nullable=False, default="en", server_default="en"
    )

    # ---------- Vehicle ----------
    vehicle_type: Mapped[str] = mapped_column(String(20), nullable=False)
    vehicle_brand_model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    fuel_method: Mapped[str] = mapped_column(String(30), nullable=False)
    weekly_expense: Mapped[int] = mapped_column(Integer, nullable=False)
    monthly_maintenance: Mapped[int] = mapped_column(Integer, nullable=False)

    # ---------- Pain points (array of free-text tags) ----------
    top_challenges: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, default=list, server_default="{}"
    )
    ev_challenges: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, default=list, server_default="{}"
    )
    petrol_challenges: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, default=list, server_default="{}"
    )

    # ---------- Insurance ----------
    has_accident_insurance: Mapped[str] = mapped_column(String(10), nullable=False)
    has_health_insurance: Mapped[str] = mapped_column(String(10), nullable=False)
    paid_out_of_pocket: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )

    # ---------- EV intent ----------
    open_to_switch: Mapped[str] = mapped_column(String(20), nullable=False)
    switch_motivators: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, default=list, server_default="{}"
    )
    interested_in: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, default=list, server_default="{}"
    )

    # ---------- Referral ----------
    referred_by_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    referral_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)

    # ---------- Gamification ----------
    points: Mapped[int] = mapped_column(
        Integer, nullable=False, default=10, server_default="10"
    )
    referral_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    milestone_10_reached: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    milestone_25_reached: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    milestone_50_reached: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )

    # ---------- Analytics ----------
    # GIN index is created in the initial migration (special index type, not a simple B-tree)
    segments: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, default=list, server_default="{}"
    )
    is_duplicate: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    source: Mapped[str] = mapped_column(
        String(20), nullable=False, default="web", server_default="web"
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Rider id={self.id} phone={self.phone} points={self.points}>"


# A note on the GIN index for `segments`:
# SQLAlchemy doesn't have a clean cross-DB GIN type, and B-tree indexes are
# declared via __table_args__ above. The GIN index is added explicitly in
# the Alembic migration (alembic/versions/0001_initial.py) using:
#     op.create_index("idx_riders_segments", "riders", ["segments"],
#                     postgresql_using="gin")
