"""Internationalization helpers.

Loads translation files from ``app/locales/{lang}.json`` and resolves
dotted keys (e.g. ``"errors.phone_invalid"``). Caches loaded locales
in memory, keyed by language and the file's mtime — so editing a JSON
file is picked up on the next request without a restart.
"""

from __future__ import annotations

import json
import threading
from pathlib import Path
from typing import Any

from app.config import settings

LOCALES_DIR = Path(__file__).resolve().parent.parent / "locales"
SUPPORTED_LANGUAGES = ("en", "hi", "kn")

_cache: dict[str, tuple[float, dict[str, Any]]] = {}
_lock = threading.Lock()


def _load_from_disk(lang: str) -> dict[str, Any]:
    path = LOCALES_DIR / f"{lang}.json"
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def load_locale(lang: str) -> dict[str, Any]:
    """Load and cache a locale dict. Refreshes if the file mtime changed."""
    if lang not in SUPPORTED_LANGUAGES:
        lang = settings.default_language

    path = LOCALES_DIR / f"{lang}.json"
    mtime = path.stat().st_mtime if path.exists() else 0.0

    with _lock:
        cached = _cache.get(lang)
        if cached and cached[0] == mtime:
            return cached[1]
        data = _load_from_disk(lang)
        _cache[lang] = (mtime, data)
        return data


def _resolve(data: dict[str, Any], key: str) -> str | None:
    """Resolve a dotted key against a nested dict. Returns ``None`` if missing."""
    node: Any = data
    for part in key.split("."):
        if not isinstance(node, dict) or part not in node:
            return None
        node = node[part]
    return node if isinstance(node, str) else None


def get_message(lang: str, key: str, **vars: Any) -> str:
    """Fetch a translated string, with safe fallbacks.

    Resolution order:
      1. ``lang``  -> ``en`` -> raw ``key``
      2. The value is run through ``str.format(**vars)`` if vars are given;
         format errors fall back to the raw template.
    """
    for candidate in (lang, "en"):
        if candidate not in SUPPORTED_LANGUAGES:
            continue
        data = load_locale(candidate)
        template = _resolve(data, key)
        if template is not None:
            if vars:
                try:
                    return template.format(**vars)
                except (KeyError, IndexError, ValueError):
                    return template
            return template
    return key
