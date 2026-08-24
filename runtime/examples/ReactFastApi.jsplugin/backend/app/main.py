from __future__ import annotations

import json
import logging
import time
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from starlette.responses import JSONResponse

from . import services
from .database import Base
from .observability import request_id_var
from .routers import auth, permissions, players, realtime, shop
from .settings import Settings


def create_app(
    database_url: str | None = None,
    api_key: str | None = None,
    *,
    jwt_secret: str | None = None,
    admin_player_ids: str | None = None,
    auto_create_schema: bool | None = None,
) -> FastAPI:
    settings = Settings()
    overrides = {
        key: value
        for key, value in {
            "database_url": database_url,
            "api_key": api_key,
            "jwt_secret": jwt_secret,
            "admin_player_ids": admin_player_ids,
            "auto_create_schema": auto_create_schema,
        }.items()
        if value is not None
    }
    settings = settings.model_copy(update=overrides)
    engine_options = (
        # SQLite has one writer. Give a short, legitimate burst time to finish
        # before translating a persistent lock into the retryable 503 below.
        {"connect_args": {"timeout": 5.0}}
        if settings.database_url.startswith("sqlite")
        else {}
    )
    engine = create_async_engine(settings.database_url, **engine_options)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    logger = logging.getLogger("graaly.api")

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        if settings.auto_create_schema:
            async with engine.begin() as connection:
                await connection.run_sync(Base.metadata.create_all)
        await services.seed_authorization(session_factory)
        yield
        await engine.dispose()

    application = FastAPI(
        title="Graaly game API",
        version="2.0.0",
        lifespan=lifespan,
    )
    application.state.settings = settings
    application.state.api_key = settings.api_key
    application.state.session_factory = session_factory

    @application.exception_handler(OperationalError)
    async def database_unavailable(request: Request, _: OperationalError) -> JSONResponse:
        request_id = getattr(request.state, "request_id", "unknown")
        logger.warning(
            json.dumps(
                {
                    "event": "database.unavailable",
                    "request_id": request_id,
                    "path": request.url.path,
                }
            )
        )
        return JSONResponse(
            status_code=503,
            content={"detail": "Database temporarily unavailable"},
            headers={"Retry-After": "1"},
        )

    @application.middleware("http")
    async def request_context(request, call_next):
        """Attach one request id and timing measurement around the whole pipeline."""
        request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
        request.state.request_id = request_id
        context_token = request_id_var.set(request_id)
        started = time.perf_counter()
        try:
            response = await call_next(request)
            duration_ms = (time.perf_counter() - started) * 1000
            response.headers["x-request-id"] = request_id
            response.headers["server-timing"] = f"app;dur={duration_ms:.2f}"
            logger.info(
                json.dumps(
                    {
                        "event": "request.completed",
                        "request_id": request_id,
                        "method": request.method,
                        "path": request.url.path,
                        "status": response.status_code,
                        "duration_ms": round(duration_ms, 2),
                    }
                )
            )
            return response
        finally:
            request_id_var.reset(context_token)

    application.include_router(auth.router)
    application.include_router(players.router)
    application.include_router(shop.router)
    application.include_router(realtime.router)
    application.include_router(permissions.router)

    @application.get("/health", tags=["operations"])
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @application.get("/ready", tags=["operations"])
    async def ready() -> dict[str, str]:
        async with session_factory() as session:
            await session.execute(text("SELECT 1"))
        return {"status": "ready"}

    return application


app = create_app()
