"""Async SQLAlchemy engine, session factory, and FastAPI dependency.

Tuned for Neon serverless Postgres:
- Small connection pool (Neon recommends max ~10 connections per app)
- ``pool_pre_ping=True`` to recycle stale connections (Neon auto-suspends)
- ``pool_recycle`` shorter than Neon's idle timeout
"""

from __future__ import annotations

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import settings


def _make_engine() -> AsyncEngine:
    return create_async_engine(
        settings.database_url,
        echo=settings.db_echo,
        pool_size=settings.db_pool_size,
        max_overflow=settings.db_max_overflow,
        pool_pre_ping=True,
        pool_recycle=280,  # Neon auto-suspends at 5min; recycle before that
        future=True,
    )


engine: AsyncEngine = _make_engine()

# ``expire_on_commit=False`` keeps attributes accessible after commit (common gotcha)
AsyncSessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession,
    autoflush=False,
)


async def get_db() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency that yields an ``AsyncSession`` and closes it after."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def dispose_engine() -> None:
    """Gracefully close the engine (call on app shutdown)."""
    await engine.dispose()
