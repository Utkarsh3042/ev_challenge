"""Pytest fixtures shared across the test suite.

PR #1: settings + sync health-check client.
PR #2: async test DB session, httpx AsyncClient, mock dispatcher, admin token.
"""

from __future__ import annotations

import os
import uuid
from collections.abc import AsyncIterator, Iterator
from typing import Any

# Ensure env vars are set BEFORE app modules import
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://roadwarrior:roadwarrior@localhost:5432/roadwarrior_test",
)
os.environ.setdefault("JWT_SECRET", "test-secret-please-change-in-real-env")
os.environ.setdefault("APP_ENV", "development")
os.environ.setdefault("FRONTEND_BASE_URL", "http://localhost:3000")

import httpx
import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import ASGITransport
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

TEST_DATABASE_URL = os.environ["DATABASE_URL"]

# Imports after env is set
from app.auth.jwt import create_access_token
from app.auth.security import hash_password
from app.config import get_settings
from app.database import get_db
from app.main import create_app
from app.models import Admin, Base, PointsTransaction, Rider


# ---------- Sync (PR #1) ----------
@pytest.fixture(scope="session")
def settings():
    get_settings.cache_clear()  # type: ignore[attr-defined]
    return get_settings()


@pytest.fixture()
def sync_client(settings) -> Iterator[TestClient]:
    app = create_app()
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def health_payload(sync_client) -> dict[str, Any]:
    resp = sync_client.get("/api/health")
    assert resp.status_code == 200
    return resp.json()


# ---------- Async DB ----------
@pytest_asyncio.fixture(scope="session")
async def db_engine():
    engine = create_async_engine(TEST_DATABASE_URL, future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture()
async def db_session(db_engine) -> AsyncIterator[AsyncSession]:
    maker = async_sessionmaker(bind=db_engine, expire_on_commit=False, class_=AsyncSession)
    async with maker() as session:
        await session.execute(delete(PointsTransaction))
        await session.execute(delete(Rider))
        await session.execute(delete(Admin))
        await session.commit()
        yield session


# ---------- Async HTTPX client ----------
@pytest_asyncio.fixture()
async def client(db_session) -> AsyncIterator[httpx.AsyncClient]:
    app = create_app()
    app.dependency_overrides[get_db] = lambda: _iter_session(db_session)
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


async def _iter_session(session: AsyncSession) -> AsyncIterator[AsyncSession]:
    yield session


# ---------- Mock dispatcher ----------
class MockDispatcher:
    def __init__(self) -> None:
        self.calls: list[dict[str, Any]] = []

    def _result(self, body: str):
        return type("Result", (), {"success": True, "sid": "MOCK-test", "error": None, "body": body})()

    async def send_welcome(self, db, rider):
        self.calls.append({"method": "send_welcome", "rider_id": str(rider.id), "phone": rider.phone})
        return self._result(f"Welcome {rider.full_name}!")

    async def send_milestone(self, db, rider, milestone):
        self.calls.append({"method": "send_milestone", "rider_id": str(rider.id), "milestone": milestone})
        return self._result(f"Milestone {milestone}!")

    async def send_my_score(self, db, rider, stats):
        self.calls.append({"method": "send_my_score", "rider_id": str(rider.id)})
        return self._result("Score")

    async def send_referral_share(self, db, rider):
        self.calls.append({"method": "send_referral_share", "rider_id": str(rider.id)})
        return self._result("Share")

    async def send_generic(self, db, phone, body):
        self.calls.append({"method": "send_generic", "phone": phone, "body": body})
        return self._result(body)


@pytest.fixture()
def mock_dispatcher(client):
    """Inject a MockDispatcher into the FastAPI app's dep overrides.

    We piggyback on the ``client`` fixture (which creates the app) so
    the override is registered against the same app the client uses.
    """
    mock = MockDispatcher()
    from app.api.deps import get_whatsapp_dispatcher
    # Access the app via the client transport
    app = client._transport.app  # type: ignore[attr-defined]
    app.dependency_overrides[get_whatsapp_dispatcher] = lambda: mock
    return mock


# ---------- Test admin ----------
@pytest_asyncio.fixture()
async def admin_user(db_session) -> Admin:
    a = Admin(
        email=f"admin-{uuid.uuid4().hex[:8]}@test.com",
        password_hash=hash_password("admin123"),
        is_active=True,
    )
    db_session.add(a)
    await db_session.commit()
    await db_session.refresh(a)
    return a


@pytest.fixture()
def admin_token(admin_user) -> str:
    return create_access_token(admin_user.id, email=admin_user.email)


@pytest.fixture()
def admin_auth_headers(admin_token) -> dict[str, str]:
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- Event loop override (required for session-scoped async fixtures) ----------
@pytest.fixture(scope="session")
def event_loop():
    """Session-scoped event loop so session-scoped async fixtures share it."""
    import asyncio as _asyncio
    loop = _asyncio.new_event_loop()
    yield loop
    loop.close()
