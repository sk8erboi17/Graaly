from __future__ import annotations

import secrets
from collections.abc import AsyncIterator
from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, Header, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from . import services
from .auth import ActorContext, decode_access_token


async def get_session(request: Request) -> AsyncIterator[AsyncSession]:
    """Give one AsyncSession to one request and always close it afterwards."""
    factory = request.app.state.session_factory
    async with factory() as session:
        yield session


async def require_api_key(
    request: Request,
    x_graaly_key: Annotated[str, Header()] = "",
) -> None:
    expected: str = request.app.state.api_key
    if not secrets.compare_digest(x_graaly_key, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Graaly API key",
        )


SessionDep = Annotated[AsyncSession, Depends(get_session)]

bearer = HTTPBearer(auto_error=False)


async def get_current_actor(
    request: Request,
    session: SessionDep,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> ActorContext:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing player session",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        identity = decode_access_token(
            credentials.credentials,
            request.app.state.settings.jwt_secret,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error),
            headers={"WWW-Authenticate": "Bearer"},
        ) from error
    return await services.resolve_actor(
        session,
        identity.player_id,
        identity.player_name,
        request.app.state.settings.admin_ids,
    )


ActorDep = Annotated[ActorContext, Depends(get_current_actor)]


def require_permission(permission: str) -> Callable[..., object]:
    async def dependency(actor: ActorDep) -> ActorContext:
        if not actor.can(permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing permission: {permission}",
            )
        return actor

    dependency.__name__ = "require_" + permission.replace(".", "_")
    return dependency
