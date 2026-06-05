"""PostHog initialization and tracking."""

import logging
from typing import Any

from app.config import settings

logger = logging.getLogger("road_warrior.posthog")

_posthog_client = None


def init_posthog() -> None:
    """Initialize PostHog SDK if configured."""
    global _posthog_client
    if not settings.posthog_project_api_key:
        logger.debug("POSTHOG_PROJECT_API_KEY not set, PostHog disabled")
        return

    try:
        from posthog import Posthog

        _posthog_client = Posthog(
            settings.posthog_project_api_key,
            host=settings.posthog_host,
        )
        logger.info("PostHog initialized")
    except ImportError:
        logger.warning("posthog not installed, but POSTHOG_PROJECT_API_KEY is set")


def track_event(distinct_id: str, event_name: str, properties: dict[str, Any] | None = None) -> None:
    """Track an event in PostHog. Safe to call even if unconfigured."""
    if _posthog_client:
        try:
            _posthog_client.capture(distinct_id, event=event_name, properties=properties)
        except Exception as exc:
            logger.warning("Failed to track event %s: %s", event_name, exc)
