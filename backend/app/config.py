"""Application configuration loaded from environment variables.

Uses ``pydantic-settings`` so all env vars are declared in one place with
types, defaults, and descriptions. Import the singleton ``settings`` from
anywhere in the codebase.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Annotated, Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    """All application settings, loaded from env vars / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ---------- App ----------
    app_env: Literal["development", "staging", "production"] = "development"
    app_name: str = "Road Warrior"
    app_version: str = "0.1.0"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    api_v1_prefix: str = "/api"
    default_language: Literal["en", "hi", "kn"] = "en"

    # ---------- Database ----------
    database_url: str = Field(
        ...,
        description="Async SQLAlchemy URL, e.g. postgresql+asyncpg://...?sslmode=require",
    )
    db_pool_size: int = Field(default=5, ge=1, le=50)
    db_max_overflow: int = Field(default=10, ge=0, le=100)
    db_echo: bool = False

    # ---------- Auth / Security ----------
    jwt_secret: str = Field(..., min_length=8)
    jwt_algorithm: str = "HS256"
    jwt_expires_min: int = 60
    admin_bootstrap_token: str | None = None

    # ---------- CORS ----------
    # ``NoDecode`` tells pydantic-settings NOT to JSON-parse this field;
    # the ``_split_cors`` validator below then splits the comma-separated string.
    cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://localhost:8000",
        ]
    )

    # ---------- Twilio / WhatsApp (PR #4) ----------
    whatsapp_mode: Literal["mock", "twilio"] = "mock"
    twilio_account_sid: str | None = None
    twilio_auth_token: str | None = None
    twilio_whatsapp_from: str | None = None
    twilio_webhook_url: str | None = None

    # ---------- Feature flags ----------
    enable_referral_program: bool = True
    enable_whatsapp_bot: bool = False
    enable_admin_dashboard: bool = True

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_cors(cls, v: object) -> object:
        """Allow ``CORS_ORIGINS`` to be a comma-separated string in env."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @field_validator("database_url")
    @classmethod
    def _ensure_asyncpg(cls, v: str) -> str:
        """Ensure DATABASE_URL uses the asyncpg driver (SQLAlchemy 2.0 async)."""
        if not v.startswith("postgresql+asyncpg://"):
            raise ValueError(
                "DATABASE_URL must start with 'postgresql+asyncpg://' "
                "(SQLAlchemy 2.0 async requires the explicit asyncpg driver)."
            )
        return v

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"

    # ---------- Milestone config (referral program) ----------
    # Referrer earns MILESTONE_X_BONUS points each time they hit
    # MILESTONE_X_REFERRALS successful referrals. The boolean flags
    # on the Rider row make this idempotent.
    milestone_10_referrals: int = 10
    milestone_10_bonus: int = 100
    milestone_25_referrals: int = 25
    milestone_25_bonus: int = 300
    milestone_50_referrals: int = 50
    milestone_50_bonus: int = 500

    # Signup bonus (every new rider gets this)
    signup_bonus: int = 10
    # Per-referral bonus (paid to the referrer when a new rider signs up)
    referral_bonus: int = 5

    # Referral code settings
    referral_code_prefix: str = "RW-"
    referral_code_alphabet: str = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no 0/O/1/I/L
    referral_code_length: int = 4
    referral_code_max_attempts: int = 5

    # Frontend URL (used to build share/QR links). Override in prod.
    frontend_base_url: str = "http://localhost:3000"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached Settings instance (singleton pattern)."""
    return Settings()  # type: ignore[call-arg]


# Global, importable settings object
settings = get_settings()
