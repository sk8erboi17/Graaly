from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from .. import services
from ..auth import issue_access_token
from ..dependencies import ActorDep, SessionDep, require_api_key
from ..schemas import ActorResponse, SessionRequest, SessionResponse


router = APIRouter(prefix="/v1/auth", tags=["authentication"])


@router.post(
    "/session",
    response_model=SessionResponse,
    dependencies=[Depends(require_api_key)],
    summary="Exchange a trusted game-server identity for a short player session",
)
async def create_session(
    command: SessionRequest,
    request: Request,
    session: SessionDep,
) -> SessionResponse:
    settings = request.app.state.settings
    actor = await services.resolve_actor(
        session,
        command.player_id,
        command.player_name,
        settings.admin_ids,
    )
    return SessionResponse(
        access_token=issue_access_token(
            actor.player_id,
            actor.player_name,
            settings.jwt_secret,
            settings.token_ttl_seconds,
        ),
        expires_in=settings.token_ttl_seconds,
        actor=services.actor_response(actor),
    )


@router.get(
    "/me",
    response_model=ActorResponse,
    summary="Resolve the authenticated player's current roles and permissions",
)
async def current_actor(actor: ActorDep) -> ActorResponse:
    return services.actor_response(actor)
