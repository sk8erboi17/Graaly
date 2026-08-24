from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ProfileResponse(BaseModel):
    id: str
    name: str
    rank: str
    coins: int
    purchases: int


class PurchaseRequest(BaseModel):
    item: Literal["diamond", "gold", "speed"]


class Reward(BaseModel):
    material: Literal["DIAMOND", "GOLD_INGOT", "SUGAR"]
    amount: int = Field(ge=1, le=64)


class PurchaseResponse(BaseModel):
    profile: ProfileResponse
    reward: Reward
    message: str


class RealtimeClientMessage(BaseModel):
    type: Literal["ping", "profile.refresh"]
    request_id: str = Field(min_length=1, max_length=64)


class RealtimeServerMessage(BaseModel):
    type: Literal["connected", "pong", "profile.invalidated", "error"]
    player_id: str
    request_id: str | None = None
    detail: str | None = None


PermissionKey = Literal[
    "profile.read",
    "shop.purchase",
    "realtime.connect",
    "permissions.read",
    "permissions.manage",
]
RoleKey = Literal["member", "moderator", "admin"]


class SessionRequest(BaseModel):
    player_id: str = Field(
        min_length=1,
        max_length=36,
        pattern=r"^[A-Za-z0-9][A-Za-z0-9:_-]{0,35}$",
    )
    player_name: str = Field(
        min_length=1,
        max_length=16,
        pattern=r"^[A-Za-z0-9_]{1,16}$",
    )


class ActorResponse(BaseModel):
    player_id: str
    player_name: str
    roles: list[RoleKey]
    permissions: list[PermissionKey]


class SessionResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int
    actor: ActorResponse


class RoleResponse(BaseModel):
    key: RoleKey
    name: str
    permissions: list[PermissionKey]


class AuthorizationResponse(BaseModel):
    player_id: str
    player_name: str
    roles: list[RoleKey]
    permissions: list[PermissionKey]


class SetPlayerRolesRequest(BaseModel):
    roles: list[RoleKey] = Field(min_length=1, max_length=3)
