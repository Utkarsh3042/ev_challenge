"""Pytest fixtures shared across the test suite.

PR #1 only needs the minimum: a configured Settings instance and the
ability to spin up the FastAPI app via the TestClient. Real DB fixtures
(test Postgres, transactions, etc.) arrive in PR #2.
"""

from __future__ import annotations

import os
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient


# Ensure tests have a valid DATABASE_URL / JWT_SECRET before app import.
# These can be overridden by real env vars or a pytest .env.
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://roadwarrior:roadwarrior@localhost:5432/roadwarrior_test",
)
os.environ.setdefault("JWT_SECRET", "test-secret-please-change-in-real-env")
os.environ.setdefault("APP_ENV", "development")


@pytest.fixture(scope="session")
def settings():
    """Loaded Settings singleton."""
    from app.config import get_settings

    get_settings.cache_clear()  # type: ignore[attr-defined]
    return get_settings()


@pytest.fixture()
def client(settings) -> Iterator[TestClient]:
    """Synchronous FastAPI test client."""
    from app.main import create_app

    app = create_app()
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def health_payload(client: TestClient) -> dict:
    """Cache the /api/health response so multiple tests don't re-hit it."""
    resp = client.get("/api/health")
    assert resp.status_code == 200
    return resp.json()
