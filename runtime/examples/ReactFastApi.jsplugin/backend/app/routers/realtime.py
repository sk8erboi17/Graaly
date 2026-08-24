from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, WebSocketException, status
from pydantic import ValidationError

from .. import services
from ..auth import ActorContext, REALTIME_CONNECT, decode_access_token
from ..dependencies import require_permission
from ..schemas import RealtimeClientMessage, RealtimeServerMessage


router = APIRouter(prefix="/v1/realtime", tags=["realtime"])
CanConnect = Annotated[ActorContext, Depends(require_permission(REALTIME_CONNECT))]


@router.post(
    "/validate",
    response_model=RealtimeServerMessage,
    summary="Validate the same messages used by the WebSocket stream",
)
async def validate_message(
    message: RealtimeClientMessage,
    actor: CanConnect,
) -> RealtimeServerMessage:
    """HTTP contract endpoint keeps WebSocket payloads visible in OpenAPI."""
    return RealtimeServerMessage(
        type="pong" if message.type == "ping" else "profile.invalidated",
        player_id=actor.player_id,
        request_id=message.request_id,
    )


async def require_websocket_actor(
    websocket: WebSocket,
    player_id: str,
) -> ActorContext:
    """Authenticate before accept and resolve live permissions from the database."""
    authorization = websocket.headers.get("authorization", "")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)

    try:
        identity = decode_access_token(token, websocket.app.state.settings.jwt_secret)
    except ValueError as error:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION) from error
    if identity.player_id != player_id:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)

    async with websocket.app.state.session_factory() as session:
        actor = await services.resolve_actor(
            session,
            identity.player_id,
            identity.player_name,
            websocket.app.state.settings.admin_ids,
        )
    if not actor.can(REALTIME_CONNECT):
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
    return actor


@router.websocket("/{player_id}")
async def player_stream(
    websocket: WebSocket,
    player_id: str,
    _: Annotated[ActorContext, Depends(require_websocket_actor)],
) -> None:
    await websocket.accept()
    await websocket.send_json(
        RealtimeServerMessage(type="connected", player_id=player_id).model_dump()
    )

    try:
        while True:
            raw = await websocket.receive_json()
            try:
                command = RealtimeClientMessage.model_validate(raw)
            except ValidationError as error:
                await websocket.send_json(
                    RealtimeServerMessage(
                        type="error",
                        player_id=player_id,
                        detail=error.errors(include_url=False)[0]["msg"],
                    ).model_dump(exclude_none=True)
                )
                continue

            response_type = (
                "pong" if command.type == "ping" else "profile.invalidated"
            )
            await websocket.send_json(
                RealtimeServerMessage(
                    type=response_type,
                    player_id=player_id,
                    request_id=command.request_id,
                ).model_dump(exclude_none=True)
            )
    except WebSocketDisconnect:
        return
