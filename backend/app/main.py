"""FastAPI application entry point.

PR #1 only sets up the skeleton: app instance, CORS, health check,
lifespan hooks, and an empty ``/api`` router. Routes are added in PR #2+.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.config import settings
from app.database import dispose_engine

# Configure logging as early as possible
logging.basicConfig(
    level=settings.log_level,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("road_warrior")


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001 — FastAPI passes app
    """Startup / shutdown hooks."""
    logger.info("🚀  %s v%s starting in %s mode", settings.app_name, __version__, settings.app_env)
    yield
    logger.info("🛑  Shutting down — disposing DB engine")
    await dispose_engine()


def create_app() -> FastAPI:
    """Application factory. Keeps imports cheap and tests easy."""
    app = FastAPI(
        title=settings.app_name,
        version=__version__,
        description=(
            "Road Warrior — survey + referral platform for India's delivery riders. "
            "See README.md and /docs for the OpenAPI spec."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # ---------- CORS ----------
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ---------- Health ----------
    @app.get(f"{settings.api_v1_prefix}/health", tags=["meta"])
    async def health() -> dict[str, str]:
        """Liveness probe — used by Docker, K8s, Fly, Render, etc."""
        return {"status": "ok", "app": settings.app_name, "version": __version__}

    @app.get("/", tags=["meta"], include_in_schema=False)
    async def root() -> dict[str, str]:
        return {
            "message": f"Welcome to {settings.app_name} API",
            "docs": "/docs",
            "redoc": "/redoc",
            "health": f"{settings.api_v1_prefix}/health",
        }

    # Mount the (empty for now) v1 API router — populated in PR #2
    # from app.api.v1 import api_router
    # app.include_router(api_router, prefix=settings.api_v1_prefix)

    return app


app = create_app()
