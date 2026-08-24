from __future__ import annotations

import asyncio
import json
import os
import sqlite3
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from starlette.websockets import WebSocketDisconnect

from app.auth import ActorContext, PROFILE_READ
from app.database import Base
from app.dependencies import get_current_actor
from app.main import create_app
from app.models import PlayerProfile, PlayerRole, Purchase
from app.schemas import PurchaseRequest
from app import services


SERVICE_KEY = "test-service-secret"
JWT_SECRET = "test-jwt-secret-with-at-least-thirty-two-bytes"


def make_app(tmp_path: Path, name: str = "test.db", **overrides):
    return create_app(
        f"sqlite+aiosqlite:///{tmp_path / name}",
        SERVICE_KEY,
        jwt_secret=JWT_SECRET,
        **overrides,
    )


def mint(
    client: TestClient,
    player_id: str,
    player_name: str,
) -> tuple[dict[str, str], dict]:
    response = client.post(
        "/v1/auth/session",
        headers={"x-graaly-key": SERVICE_KEY},
        json={"player_id": player_id, "player_name": player_name},
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    return {"authorization": f"Bearer {payload['access_token']}"}, payload


def purchase_headers(headers: dict[str, str], key: str) -> dict[str, str]:
    return headers | {"idempotency-key": key}


def test_session_profile_and_purchase_are_persisted(tmp_path: Path) -> None:
    app = make_app(tmp_path)

    with TestClient(app) as client:
        assert client.post(
            "/v1/auth/session",
            json={"player_id": "player-1", "player_name": "Alex"},
        ).status_code == 401
        assert client.get("/v1/players/player-1/ui").status_code == 401

        headers, session = mint(client, "player-1", "Alex")
        assert session["token_type"] == "bearer"
        assert session["actor"]["roles"] == ["member"]
        assert "shop.purchase" in session["actor"]["permissions"]

        profile = client.get("/v1/players/player-1/ui", headers=headers)
        assert profile.status_code == 200
        assert profile.json()["coins"] == 150
        assert profile.headers["x-request-id"]
        assert profile.headers["server-timing"].startswith("app;dur=")

        for index, expected_coins in enumerate((110, 70, 30), start=1):
            purchase = client.post(
                "/v1/shop/purchase",
                headers=purchase_headers(headers, f"purchase-{index}"),
                json={"item": "diamond"},
            )
            assert purchase.status_code == 200
            assert purchase.json()["profile"]["coins"] == expected_coins
            assert purchase.json()["reward"] == {
                "material": "DIAMOND",
                "amount": 1,
            }

        rejected = client.post(
            "/v1/shop/purchase",
            headers=purchase_headers(headers, "purchase-4"),
            json={"item": "diamond"},
        )
        assert rejected.status_code == 402
        persisted = client.get("/v1/players/player-1/ui", headers=headers).json()
        assert persisted["coins"] == 30
        assert persisted["purchases"] == 3


def test_concurrent_session_creation_is_idempotent(tmp_path: Path) -> None:
    async def scenario() -> None:
        engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'sessions.db'}")
        factory = async_sessionmaker(engine, expire_on_commit=False)
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        await services.seed_authorization(factory)

        async def resolve() -> ActorContext:
            async with factory() as session:
                return await services.resolve_actor(session, "same-player", "Alex")

        actors = await asyncio.gather(*(resolve() for _ in range(16)))
        assert all(actor.player_id == "same-player" for actor in actors)
        assert all(actor.roles == frozenset({"member"}) for actor in actors)
        async with factory() as session:
            assert await session.scalar(select(func.count()).select_from(PlayerProfile)) == 1
            assert await session.scalar(select(func.count()).select_from(PlayerRole)) == 1
        await engine.dispose()

    asyncio.run(scenario())


def test_concurrent_profile_helper_is_idempotent(tmp_path: Path) -> None:
    async def scenario() -> None:
        engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'profiles.db'}")
        factory = async_sessionmaker(engine, expire_on_commit=False)
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

        async def create() -> str:
            async with factory() as session:
                profile = await services.get_or_create_profile(
                    session,
                    "same-profile",
                    "Alex",
                )
                return profile.id

        profile_ids = await asyncio.gather(*(create() for _ in range(16)))
        assert profile_ids == ["same-profile"] * 16
        async with factory() as session:
            assert await session.scalar(select(func.count()).select_from(PlayerProfile)) == 1
        await engine.dispose()

    asyncio.run(scenario())


def test_concurrent_purchases_are_atomic(tmp_path: Path) -> None:
    async def scenario() -> None:
        engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'purchases.db'}")
        factory = async_sessionmaker(engine, expire_on_commit=False)
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        await services.seed_authorization(factory)
        async with factory() as session:
            actor = await services.resolve_actor(session, "buyer", "Alex")

        async def purchase_once(index: int) -> bool:
            async with factory() as session:
                try:
                    await services.purchase_item(
                        session,
                        actor,
                        PurchaseRequest(item="diamond"),
                        f"concurrent-{index}",
                    )
                    return True
                except services.InsufficientCoins:
                    return False

        outcomes = await asyncio.gather(*(purchase_once(index) for index in range(16)))
        assert outcomes.count(True) == 3
        assert outcomes.count(False) == 13
        async with factory() as session:
            profile = await session.get(PlayerProfile, "buyer")
            assert profile is not None
            assert profile.coins == 30
            assert profile.purchases == 3
            assert await session.scalar(select(func.count()).select_from(Purchase)) == 3
        await engine.dispose()

    asyncio.run(scenario())


def test_concurrent_http_sessions_and_purchases_keep_invariants(tmp_path: Path) -> None:
    """Exercise the public ASGI boundary, not only the service functions."""
    database = tmp_path / "concurrent-http.db"
    app = make_app(tmp_path, database.name)

    with TestClient(app) as client:
        def open_session(_: int):
            return client.post(
                "/v1/auth/session",
                headers={"x-graaly-key": SERVICE_KEY},
                json={"player_id": "http-buyer", "player_name": "Alex"},
            )

        with ThreadPoolExecutor(max_workers=16) as pool:
            sessions = list(pool.map(open_session, range(16)))

        assert [response.status_code for response in sessions] == [200] * 16
        tokens = {response.json()["access_token"] for response in sessions}
        # Tokens may be identical inside one second; every one must describe
        # the same single logical session actor regardless of that detail.
        assert all(
            response.json()["actor"]["player_id"] == "http-buyer"
            for response in sessions
        )
        headers = {"authorization": f"Bearer {next(iter(tokens))}"}

        def purchase(index: int):
            return client.post(
                "/v1/shop/purchase",
                headers=purchase_headers(headers, f"http-purchase-{index}"),
                json={"item": "diamond"},
            )

        with ThreadPoolExecutor(max_workers=16) as pool:
            purchases = list(pool.map(purchase, range(16)))

        statuses = [response.status_code for response in purchases]
        assert statuses.count(200) == 3
        assert statuses.count(402) == 13
        assert set(statuses) == {200, 402}

        profile = client.get("/v1/players/http-buyer/ui", headers=headers)
        assert profile.status_code == 200
        assert profile.json()["coins"] == 30
        assert profile.json()["purchases"] == 3

    with sqlite3.connect(database) as connection:
        assert connection.execute(
            "SELECT count(*) FROM player_profiles WHERE id = 'http-buyer'"
        ).fetchone()[0] == 1
        assert connection.execute(
            "SELECT count(*) FROM player_roles WHERE player_id = 'http-buyer'"
        ).fetchone()[0] == 1
        assert connection.execute(
            "SELECT count(*) FROM purchases WHERE player_id = 'http-buyer'"
        ).fetchone()[0] == 3


def test_purchase_idempotency_replays_once_under_concurrency(tmp_path: Path) -> None:
    database = tmp_path / "idempotency.db"
    app = make_app(tmp_path, database.name)

    with TestClient(app) as client:
        headers, _ = mint(client, "replay-buyer", "Alex")
        replay_headers = purchase_headers(headers, "checkout-attempt-0001")

        def replay(_: int):
            return client.post(
                "/v1/shop/purchase",
                headers=replay_headers,
                json={"item": "diamond"},
            )

        with ThreadPoolExecutor(max_workers=16) as pool:
            responses = list(pool.map(replay, range(50)))

        assert [response.status_code for response in responses] == [200] * 50
        assert all(response.json() == responses[0].json() for response in responses)
        assert responses[0].json()["profile"]["coins"] == 110

        conflict = client.post(
            "/v1/shop/purchase",
            headers=replay_headers,
            json={"item": "gold"},
        )
        assert conflict.status_code == 409

        missing_key = client.post(
            "/v1/shop/purchase",
            headers=headers,
            json={"item": "gold"},
        )
        assert missing_key.status_code == 422

    with sqlite3.connect(database) as connection:
        profile = connection.execute(
            "SELECT coins, purchases FROM player_profiles WHERE id = 'replay-buyer'"
        ).fetchone()
        assert profile == (110, 1)
        assert connection.execute(
            "SELECT count(*) FROM purchases WHERE player_id = 'replay-buyer'"
        ).fetchone()[0] == 1


def test_session_identity_rejects_controls_paths_and_whitespace(tmp_path: Path) -> None:
    app = make_app(tmp_path, "identities.db")
    invalid_commands = [
        {"player_id": "../operator", "player_name": "Alex"},
        {"player_id": " leading", "player_name": "Alex"},
        {"player_id": "line\nbreak", "player_name": "Alex"},
        {"player_id": "nul\x00byte", "player_name": "Alex"},
        {"player_id": "valid-player", "player_name": "Alex Smith"},
        {"player_id": "valid-player", "player_name": "Alex\n"},
        {"player_id": "valid-player", "player_name": "\x00Alex"},
    ]

    with TestClient(app) as client:
        for command in invalid_commands:
            response = client.post(
                "/v1/auth/session",
                headers={"x-graaly-key": SERVICE_KEY},
                json=command,
            )
            assert response.status_code == 422, command

        valid = client.post(
            "/v1/auth/session",
            headers={"x-graaly-key": SERVICE_KEY},
            json={"player_id": "uuid:offline-player_1", "player_name": "Alex_01"},
        )
        assert valid.status_code == 200


def test_database_lock_is_reported_as_retryable_503(tmp_path: Path) -> None:
    database = tmp_path / "locked.db"
    app = make_app(tmp_path, database.name)

    with TestClient(app) as client:
        headers, _ = mint(client, "locked-player", "Alex")
        with sqlite3.connect(database, timeout=0.1, isolation_level=None) as blocker:
            blocker.execute("BEGIN EXCLUSIVE")
            response = client.get("/v1/players/locked-player/ui", headers=headers)
            blocker.rollback()

        assert response.status_code == 503
        assert response.json() == {"detail": "Database temporarily unavailable"}
        assert response.headers["retry-after"] == "1"


def test_rbac_admin_assignment_and_immediate_revocation(tmp_path: Path) -> None:
    app = make_app(tmp_path, admin_player_ids="admin-1")

    with TestClient(app) as client:
        member_headers, _ = mint(client, "member-1", "Sam")
        admin_headers, admin_session = mint(client, "admin-1", "Root")

        assert "admin" in admin_session["actor"]["roles"]
        assert client.get(
            "/v1/permissions/roles",
            headers=purchase_headers(member_headers, "denied-gold"),
        ).status_code == 403

        roles = client.get("/v1/permissions/roles", headers=admin_headers)
        assert roles.status_code == 200
        assert {role["key"] for role in roles.json()} == {
            "member",
            "moderator",
            "admin",
        }

        promoted = client.put(
            "/v1/permissions/players/member-1/roles",
            headers=admin_headers,
            json={"roles": ["moderator"]},
        )
        assert promoted.status_code == 200
        assert promoted.json()["roles"] == ["moderator"]

        # The already-issued token still identifies Sam, but live DB permissions
        # immediately reject a purchase after the member role is removed.
        denied = client.post(
            "/v1/shop/purchase",
            headers=purchase_headers(member_headers, "denied-gold"),
            json={"item": "gold"},
        )
        assert denied.status_code == 403
        assert denied.json()["detail"] == "Missing permission: shop.purchase"

        visible = client.get(
            "/v1/permissions/players/member-1",
            headers=member_headers,
        )
        assert visible.status_code == 200

        restored = client.put(
            "/v1/permissions/players/member-1/roles",
            headers=admin_headers,
            json={"roles": ["member"]},
        )
        assert restored.json()["permissions"] == [
            "profile.read",
            "realtime.connect",
            "shop.purchase",
        ]
        assert client.post(
            "/v1/shop/purchase",
            headers=purchase_headers(member_headers, "restored-gold"),
            json={"item": "gold"},
        ).status_code == 200

        protected_admin = client.put(
            "/v1/permissions/players/admin-1/roles",
            headers=admin_headers,
            json={"roles": ["member"]},
        )
        assert "admin" in protected_admin.json()["roles"]


def test_cross_player_profile_is_forbidden(tmp_path: Path) -> None:
    app = make_app(tmp_path)
    with TestClient(app) as client:
        first_headers, _ = mint(client, "player-1", "Alex")
        mint(client, "player-2", "Bea")
        response = client.get("/v1/players/player-2/ui", headers=first_headers)
        assert response.status_code == 403


def test_websocket_bearer_validation_and_round_trip(tmp_path: Path) -> None:
    app = make_app(tmp_path, "socket.db")

    with TestClient(app) as client:
        headers, _ = mint(client, "player-7", "Socket")
        with client.websocket_connect(
            "/v1/realtime/player-7",
            headers=headers,
        ) as socket:
            assert socket.receive_json() == {
                "type": "connected",
                "player_id": "player-7",
                "request_id": None,
                "detail": None,
            }
            socket.send_json({"type": "ping", "request_id": "request-1"})
            assert socket.receive_json() == {
                "type": "pong",
                "player_id": "player-7",
                "request_id": "request-1",
            }
            socket.send_json({"type": "unknown", "request_id": "request-2"})
            error = socket.receive_json()
            assert error["type"] == "error"
            assert error["player_id"] == "player-7"

        for path, rejected_headers in (
            ("/v1/realtime/player-7", {}),
            ("/v1/realtime/someone-else", headers),
        ):
            try:
                with client.websocket_connect(path, headers=rejected_headers):
                    raise AssertionError("unauthorized WebSocket was accepted")
            except WebSocketDisconnect as error:
                assert error.code == 1008


def test_dependency_override_isolated_from_auth_transport(tmp_path: Path) -> None:
    app = make_app(tmp_path, "override.db")
    fake_actor = ActorContext(
        player_id="test-actor",
        player_name="Test",
        roles=frozenset({"member"}),
        permissions=frozenset({PROFILE_READ}),
    )

    async def override_actor() -> ActorContext:
        return fake_actor

    app.dependency_overrides[get_current_actor] = override_actor
    with TestClient(app) as client:
        response = client.get("/v1/auth/me")
        assert response.status_code == 200
        assert response.json()["player_id"] == "test-actor"
    app.dependency_overrides.clear()


def test_alembic_migration_creates_authorization_schema(tmp_path: Path) -> None:
    backend = Path(__file__).resolve().parents[1]
    database = tmp_path / "migration.db"
    environment = os.environ | {
        "GRAALY_DATABASE_URL": f"sqlite+aiosqlite:///{database}",
    }
    subprocess.run(
        [
            sys.executable,
            "-m",
            "alembic",
            "-c",
            str(backend / "alembic.ini"),
            "upgrade",
            "head",
        ],
        cwd=backend,
        env=environment,
        check=True,
    )
    with sqlite3.connect(database) as connection:
        tables = {
            row[0]
            for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table'"
            )
        }
    assert {
        "alembic_version",
        "permission_definitions",
        "role_definitions",
        "role_permissions",
        "player_profiles",
        "player_roles",
        "purchases",
    } <= tables


def test_checked_in_openapi_contract_is_current() -> None:
    backend = Path(__file__).resolve().parents[1]
    subprocess.run(
        [sys.executable, str(backend / "scripts" / "export_openapi.py")],
        cwd=backend,
        check=True,
    )
    schema = json.loads((backend / "openapi.json").read_text(encoding="utf-8"))
    assert schema == create_app().openapi()
