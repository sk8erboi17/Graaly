from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status

from .. import services
from ..auth import ActorContext, PERMISSIONS_MANAGE, PERMISSIONS_READ
from ..dependencies import SessionDep, require_permission
from ..schemas import AuthorizationResponse, RoleResponse, SetPlayerRolesRequest


router = APIRouter(prefix="/v1/permissions", tags=["permissions"])
CanRead = Annotated[ActorContext, Depends(require_permission(PERMISSIONS_READ))]
CanManage = Annotated[ActorContext, Depends(require_permission(PERMISSIONS_MANAGE))]


@router.get("/roles", response_model=list[RoleResponse])
async def roles(_: CanRead, session: SessionDep) -> list[RoleResponse]:
    return await services.list_roles(session)


@router.get("/players/{player_id}", response_model=AuthorizationResponse)
async def player_authorization(
    player_id: str,
    _: CanRead,
    session: SessionDep,
) -> AuthorizationResponse:
    try:
        return await services.get_authorization(session, player_id)
    except services.ProfileNotFound as error:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Player profile not found") from error


@router.put("/players/{player_id}/roles", response_model=AuthorizationResponse)
async def replace_player_roles(
    player_id: str,
    command: SetPlayerRolesRequest,
    _: CanManage,
    request: Request,
    session: SessionDep,
) -> AuthorizationResponse:
    try:
        return await services.set_player_roles(
            session,
            player_id,
            command.roles,
            request.app.state.settings.admin_ids,
        )
    except services.ProfileNotFound as error:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Player profile not found") from error
