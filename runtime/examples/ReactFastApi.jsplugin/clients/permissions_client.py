from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Protocol, TypedDict

from graaly import config, http


Role = Literal["member", "moderator", "admin"]


@dataclass(frozen=True, slots=True)
class Identity:
    player_id: str
    player_name: str


class Authorization(TypedDict):
    player_id: str
    player_name: str
    roles: list[Role]
    permissions: list[str]


class TokenProvider(Protocol):
    async def __call__(self, identity: Identity) -> str: ...


BASE_URL = str(config.get("backend.url", "http://127.0.0.1:8000"))
SERVICE_KEY = str(config.get("backend.api-key", ""))


async def open_session(identity: Identity) -> str:
    response = await http.post(
        f"{BASE_URL}/v1/auth/session",
        {
            "player_id": identity.player_id,
            "player_name": identity.player_name,
        },
        headers={"x-graaly-key": SERVICE_KEY},
    )
    if not response.ok:
        raise RuntimeError(f"Session exchange failed: {response.status} {response.text()}")
    payload = response.json()
    return str(payload["access_token"])


async def replace_roles(
    actor: Identity,
    target_id: str,
    roles: list[Role],
    token_provider: TokenProvider = open_session,
) -> Authorization:
    token = await token_provider(actor)
    response = await http.put(
        f"{BASE_URL}/v1/permissions/players/{target_id}/roles",
        {"roles": roles},
        headers={"authorization": f"Bearer {token}"},
    )
    if not response.ok:
        raise RuntimeError(f"Permission update failed: {response.status} {response.text()}")
    return response.json()
