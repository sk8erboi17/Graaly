from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from .. import services
from ..auth import ActorContext, PERMISSIONS_READ, PROFILE_READ
from ..dependencies import SessionDep, require_permission
from ..schemas import ProfileResponse


router = APIRouter(
    prefix="/v1/players",
    tags=["players"],
)
CanReadProfile = Annotated[ActorContext, Depends(require_permission(PROFILE_READ))]


@router.get("/{player_id}/ui", response_model=ProfileResponse)
async def get_profile(
    player_id: str,
    actor: CanReadProfile,
    session: SessionDep,
) -> ProfileResponse:
    if player_id != actor.player_id and not actor.can(PERMISSIONS_READ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="A player may only read their own profile",
        )
    try:
        return await services.get_profile(session, player_id)
    except services.ProfileNotFound as error:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Player profile not found") from error
