"""FastAPI application entry point.

PR #1: skeleton + health check.
PR #2: mounts all routers (riders, admin, webhooks, meta) + global error handler.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from app import __version__
from app.api import admin, meta, riders, webhooks
from app.config import settings
from app.database import dispose_engine

from app.logging_config import setup_logging
from app.monitoring.sentry import init_sentry
from app.monitoring.posthog import init_posthog

setup_logging()
init_sentry()
init_posthog()

logger = logging.getLogger("road_warrior")


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001 — FastAPI passes app
    """Startup / shutdown hooks."""
    logger.info(
        "🚀  %s v%s starting in %s mode",
        settings.app_name, __version__, settings.app_env,
    )
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

    # ---------- Global error handlers ----------
    @app.exception_handler(RequestValidationError)
    async def _validation_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        """Convert Pydantic 422s into our standard error envelope."""
        first = exc.errors()[0] if exc.errors() else {}
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": first.get("msg", "Invalid request"),
                    "field": ".".join(str(x) for x in first.get("loc", [])[1:]) or None,
                }
            },
        )

    @app.exception_handler(Exception)
    async def _generic_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": {"code": "INTERNAL_ERROR", "message": "Internal server error"}},
        )

    # ---------- Health ----------
    @app.get(f"{settings.api_v1_prefix}/health", tags=["meta"])
    async def health() -> dict:
        """Liveness probe — used by Docker, K8s, Fly, Render, etc."""
        return {"status": "ok", "app": settings.app_name, "version": __version__}

    @app.get(f"{settings.api_v1_prefix}/readyz", tags=["meta"])
    async def readyz() -> dict:
        """Readiness probe — verifies DB connectivity."""
        from sqlalchemy import text
        try:
            from app.database import engine
            async with engine.begin() as conn:
                await conn.execute(text("SELECT 1"))
            return {"status": "ready"}
        except Exception as exc:
            logger.error("Readiness check failed: %s", exc)
            return JSONResponse(status_code=503, content={"status": "unavailable", "detail": str(exc)})

    @app.get(f"{settings.api_v1_prefix}/metrics", tags=["meta"])
    async def metrics() -> Response:
        """Prometheus metrics stub."""
        # Note: full Prometheus instrumentation will be added in Phase 2
        return Response(content="# HELP status Application status\nstatus 1\n", media_type="text/plain")

    @app.get("/", tags=["meta"], include_in_schema=False)
    async def root() -> dict:
        return {
            "message": f"Welcome to {settings.app_name} API",
            "docs": "/docs",
            "redoc": "/redoc",
            "health": f"{settings.api_v1_prefix}/health",
        }

    # ---------- Routers ----------
    from app.api import webhooks_status
    app.include_router(riders.router, prefix=settings.api_v1_prefix)
    app.include_router(admin.router, prefix=settings.api_v1_prefix)
    app.include_router(webhooks.router, prefix=settings.api_v1_prefix)
    app.include_router(webhooks_status.router, prefix=settings.api_v1_prefix)
    app.include_router(meta.router, prefix=settings.api_v1_prefix)

    return app

app = create_app()
