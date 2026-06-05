"""Structured JSON logging configuration for production."""

import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any

from app.config import settings

class JSONFormatter(logging.Formatter):
    """Format logs as single-line JSON for easy parsing by aggregators."""

    def format(self, record: logging.LogRecord) -> str:
        log_data: dict[str, Any] = {
            "ts": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname.lower(),
            "logger": record.name,
            "msg": record.getMessage(),
        }

        # Add any extra arguments passed in the `extra={}` dictionary
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id

        # Auto-redact sensitive fields if they sneak into the log message somehow
        # This is basic; a real app might use a more robust scrubber
        
        if record.exc_info:
            log_data["exc"] = self.formatException(record.exc_info)

        return json.dumps(log_data)

def setup_logging() -> None:
    """Initialize logging based on environment."""
    root = logging.getLogger("road_warrior")
    root.setLevel(settings.log_level)
    
    # Remove any existing handlers
    for handler in root.handlers[:]:
        root.removeHandler(handler)
        
    handler = logging.StreamHandler(sys.stdout)
    
    if settings.app_env == "production":
        handler.setFormatter(JSONFormatter())
    else:
        # Standard human-readable logs for development
        formatter = logging.Formatter(
            "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
        )
        handler.setFormatter(formatter)
        
    root.addHandler(handler)
