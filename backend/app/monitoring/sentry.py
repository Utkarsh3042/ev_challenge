"""Sentry initialization and configuration."""

import logging

from app.config import settings

logger = logging.getLogger("road_warrior.sentry")


def init_sentry() -> None:
    """Initialize Sentry SDK if configured."""
    if not settings.sentry_dsn:
        logger.debug("SENTRY_DSN not set, Sentry disabled")
        return

    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            environment=settings.app_env,
            release=settings.app_version,
            integrations=[
                FastApiIntegration(),
                SqlalchemyIntegration(),
            ],
            # Set traces_sample_rate to 1.0 to capture 100% of transactions for performance monitoring
            # Recommend lowering this in production with high traffic
            traces_sample_rate=1.0 if settings.app_env == "development" else 0.1,
            # Set profiles_sample_rate to 1.0 to profile 100% of sampled transactions
            profiles_sample_rate=1.0 if settings.app_env == "development" else 0.1,
        )
        logger.info("Sentry initialized for environment: %s", settings.app_env)
    except ImportError:
        logger.warning("sentry-sdk not installed, but SENTRY_DSN is set")
