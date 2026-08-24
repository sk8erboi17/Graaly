from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Final

import jwt
from jwt import InvalidTokenError


PROFILE_READ: Final = "profile.read"
SHOP_PURCHASE: Final = "shop.purchase"
REALTIME_CONNECT: Final = "realtime.connect"
PERMISSIONS_READ: Final = "permissions.read"
PERMISSIONS_MANAGE: Final = "permissions.manage"

PERMISSION_CATALOG: Final = {
    PROFILE_READ: "Read the authenticated player's profile and UI projection.",
    SHOP_PURCHASE: "Purchase catalog items with the authenticated player's balance.",
    REALTIME_CONNECT: "Open the authenticated realtime player stream.",
    PERMISSIONS_READ: "Inspect role definitions and another player's assignments.",
    PERMISSIONS_MANAGE: "Replace another player's role assignments.",
}

ROLE_CATALOG: Final = {
    "member": {
        "name": "Member",
        "permissions": {PROFILE_READ, SHOP_PURCHASE, REALTIME_CONNECT},
    },
    "moderator": {
        "name": "Moderator",
        "permissions": {PROFILE_READ, REALTIME_CONNECT, PERMISSIONS_READ},
    },
    "admin": {
        "name": "Administrator",
        "permissions": set(PERMISSION_CATALOG),
    },
}


@dataclass(frozen=True, slots=True)
class ActorContext:
    player_id: str
    player_name: str
    roles: frozenset[str]
    permissions: frozenset[str]

    def can(self, permission: str) -> bool:
        return permission in self.permissions


@dataclass(frozen=True, slots=True)
class TokenIdentity:
    player_id: str
    player_name: str


def issue_access_token(
    player_id: str,
    player_name: str,
    secret: str,
    ttl_seconds: int,
) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": player_id,
            "name": player_name,
            "iss": "graaly-game-server",
            "aud": "graaly-fastapi",
            "iat": now,
            "exp": now + timedelta(seconds=ttl_seconds),
        },
        secret,
        algorithm="HS256",
    )


def decode_access_token(token: str, secret: str) -> TokenIdentity:
    try:
        claims = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience="graaly-fastapi",
            issuer="graaly-game-server",
        )
        player_id = str(claims["sub"])
        player_name = str(claims["name"])
    except (InvalidTokenError, KeyError, TypeError, ValueError) as error:
        raise ValueError("Invalid or expired player session") from error
    if not player_id or not player_name:
        raise ValueError("Player session is missing its identity")
    return TokenIdentity(player_id=player_id, player_name=player_name)
