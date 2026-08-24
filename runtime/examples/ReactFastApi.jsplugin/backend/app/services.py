from __future__ import annotations

from collections.abc import Collection

from sqlalchemy import delete, select, update
from sqlalchemy.dialects.postgresql import insert as postgresql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from .auth import ActorContext, ROLE_CATALOG
from .models import (
    PermissionDefinition,
    PlayerProfile,
    PlayerRole,
    Purchase,
    RoleDefinition,
    RolePermission,
)
from .schemas import (
    ActorResponse,
    AuthorizationResponse,
    ProfileResponse,
    PurchaseRequest,
    PurchaseResponse,
    Reward,
    RoleResponse,
)


CATALOG = {
    "diamond": (40, Reward(material="DIAMOND", amount=1)),
    "gold": (25, Reward(material="GOLD_INGOT", amount=4)),
    "speed": (15, Reward(material="SUGAR", amount=1)),
}

RANK_PRIORITY = ("admin", "moderator", "member")


class InsufficientCoins(Exception):
    pass


class ProfileNotFound(Exception):
    pass


class IdempotencyConflict(Exception):
    pass


async def _insert_if_absent(
    session: AsyncSession,
    model,
    values: dict[str, object],
    conflict_columns: list[object],
) -> bool:
    """Insert once without turning a concurrent duplicate into a failed request."""
    dialect = session.get_bind().dialect.name
    if dialect == "sqlite":
        statement = (
            sqlite_insert(model)
            .values(**values)
            .on_conflict_do_nothing(index_elements=conflict_columns)
        )
        result = await session.execute(statement)
        return result.rowcount == 1
    if dialect == "postgresql":
        statement = (
            postgresql_insert(model)
            .values(**values)
            .on_conflict_do_nothing(index_elements=conflict_columns)
        )
        result = await session.execute(statement)
        return result.rowcount == 1

    candidate = model(**values)
    try:
        async with session.begin_nested():
            session.add(candidate)
            await session.flush()
        return True
    except IntegrityError:
        return False


def profile_response(profile: PlayerProfile) -> ProfileResponse:
    return ProfileResponse.model_validate(profile, from_attributes=True)


def actor_response(actor: ActorContext) -> ActorResponse:
    return ActorResponse(
        player_id=actor.player_id,
        player_name=actor.player_name,
        roles=sorted(actor.roles),
        permissions=sorted(actor.permissions),
    )


def authorization_response(actor: ActorContext) -> AuthorizationResponse:
    return AuthorizationResponse(**actor_response(actor).model_dump())


async def seed_authorization(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    """Synchronize the code-owned role catalog without deleting player assignments."""
    from .auth import PERMISSION_CATALOG

    async with session_factory() as session, session.begin():
        for key, description in PERMISSION_CATALOG.items():
            definition = await session.get(PermissionDefinition, key)
            if definition is None:
                session.add(PermissionDefinition(key=key, description=description))
            else:
                definition.description = description

        for role_key, definition in ROLE_CATALOG.items():
            role = await session.get(RoleDefinition, role_key)
            if role is None:
                session.add(RoleDefinition(key=role_key, name=str(definition["name"])))
            else:
                role.name = str(definition["name"])

        await session.flush()
        await session.execute(delete(RolePermission))
        for role_key, definition in ROLE_CATALOG.items():
            for permission in sorted(definition["permissions"]):
                session.add(
                    RolePermission(
                        role_key=role_key,
                        permission_key=str(permission),
                    )
                )


async def _load_actor(
    session: AsyncSession,
    profile: PlayerProfile,
) -> ActorContext:
    role_keys = set(
        await session.scalars(
            select(PlayerRole.role_key).where(PlayerRole.player_id == profile.id)
        )
    )
    permission_keys = set(
        await session.scalars(
            select(RolePermission.permission_key)
            .join(PlayerRole, PlayerRole.role_key == RolePermission.role_key)
            .where(PlayerRole.player_id == profile.id)
        )
    )
    return ActorContext(
        player_id=profile.id,
        player_name=profile.name,
        roles=frozenset(role_keys),
        permissions=frozenset(permission_keys),
    )


def _display_rank(roles: Collection[str]) -> str:
    for role_key in RANK_PRIORITY:
        if role_key in roles:
            return str(ROLE_CATALOG[role_key]["name"])
    return "Member"


async def resolve_actor(
    session: AsyncSession,
    player_id: str,
    player_name: str,
    bootstrap_admin_ids: Collection[str] = (),
) -> ActorContext:
    """Resolve current DB permissions; JWTs intentionally carry identity only."""
    async with session.begin():
        profile = await session.get(PlayerProfile, player_id)
        created = False
        if profile is None:
            created = await _insert_if_absent(
                session,
                PlayerProfile,
                {"id": player_id, "name": player_name},
                [PlayerProfile.id],
            )
            profile = await session.get(PlayerProfile, player_id)
        if profile is None:
            raise ProfileNotFound
        if profile.name != player_name:
            profile.name = player_name

        if created:
            await _insert_if_absent(
                session,
                PlayerRole,
                {"player_id": player_id, "role_key": "member"},
                [PlayerRole.player_id, PlayerRole.role_key],
            )
        if player_id in bootstrap_admin_ids:
            await _insert_if_absent(
                session,
                PlayerRole,
                {"player_id": player_id, "role_key": "admin"},
                [PlayerRole.player_id, PlayerRole.role_key],
            )
        await session.flush()

        actor = await _load_actor(session, profile)
        selected_rank = _display_rank(actor.roles)
        if profile.rank != selected_rank:
            profile.rank = selected_rank

    return actor


async def get_profile(
    session: AsyncSession,
    player_id: str,
) -> ProfileResponse:
    profile = await session.get(PlayerProfile, player_id)
    if profile is None:
        raise ProfileNotFound
    return profile_response(profile)


async def get_or_create_profile(
    session: AsyncSession,
    player_id: str,
    player_name: str,
) -> ProfileResponse:
    """Small service primitive retained for the migration exercises."""
    async with session.begin():
        await _insert_if_absent(
            session,
            PlayerProfile,
            {"id": player_id, "name": player_name},
            [PlayerProfile.id],
        )
        profile = await session.get(PlayerProfile, player_id)
        if profile is None:
            raise ProfileNotFound
        if profile.name != player_name:
            profile.name = player_name
    return profile_response(profile)


async def purchase_item(
    session: AsyncSession,
    actor: ActorContext,
    command: PurchaseRequest,
    idempotency_key: str,
) -> PurchaseResponse:
    price, reward = CATALOG[command.item]

    def replay(purchase: Purchase) -> PurchaseResponse:
        if purchase.item != command.item:
            raise IdempotencyConflict
        return PurchaseResponse.model_validate_json(purchase.response_json)

    try:
        async with session.begin():
            # Claim the key before changing the balance. On SQLite this is the
            # first write in the transaction, so concurrent retries queue at a
            # single deterministic boundary instead of all debiting first and
            # racing on the final unique constraint.
            claimed = await _insert_if_absent(
                session,
                Purchase,
                {
                    "player_id": actor.player_id,
                    "item": command.item,
                    "price": price,
                    "idempotency_key": idempotency_key,
                    "response_json": "{}",
                },
                [Purchase.player_id, Purchase.idempotency_key],
            )
            if not claimed:
                existing = await session.scalar(
                    select(Purchase).where(
                        Purchase.player_id == actor.player_id,
                        Purchase.idempotency_key == idempotency_key,
                    )
                )
                if existing is None:
                    raise RuntimeError("Idempotency key was claimed without a visible purchase")
                return replay(existing)

            updated = await session.execute(
                update(PlayerProfile)
                .where(
                    PlayerProfile.id == actor.player_id,
                    PlayerProfile.coins >= price,
                )
                .values(
                    coins=PlayerProfile.coins - price,
                    purchases=PlayerProfile.purchases + 1,
                )
                .returning(PlayerProfile)
                .execution_options(populate_existing=True)
            )
            profile = updated.scalar_one_or_none()
            if profile is None:
                exists = await session.scalar(
                    select(PlayerProfile.id).where(PlayerProfile.id == actor.player_id)
                )
                if exists is None:
                    raise ProfileNotFound
                raise InsufficientCoins

            response = PurchaseResponse(
                profile=profile_response(profile),
                reward=reward,
                message=f"Purchased {command.item} for {price} coins",
            )
            await session.execute(
                update(Purchase)
                .where(
                    Purchase.player_id == actor.player_id,
                    Purchase.idempotency_key == idempotency_key,
                )
                .values(response_json=response.model_dump_json())
            )
            await session.flush()
        return response
    except IntegrityError:
        await session.rollback()
        async with session.begin():
            existing = await session.scalar(
                select(Purchase).where(
                    Purchase.player_id == actor.player_id,
                    Purchase.idempotency_key == idempotency_key,
                )
            )
            if existing is None:
                raise
            return replay(existing)


async def list_roles(session: AsyncSession) -> list[RoleResponse]:
    roles = (await session.scalars(select(RoleDefinition))).all()
    permissions = (
        await session.execute(
            select(RolePermission.role_key, RolePermission.permission_key)
        )
    ).all()
    by_role: dict[str, list[str]] = {role.key: [] for role in roles}
    for role_key, permission_key in permissions:
        by_role[role_key].append(permission_key)
    return [
        RoleResponse(
            key=role.key,
            name=role.name,
            permissions=sorted(by_role[role.key]),
        )
        for role in sorted(roles, key=lambda item: item.key)
    ]


async def get_authorization(
    session: AsyncSession,
    player_id: str,
) -> AuthorizationResponse:
    profile = await session.get(PlayerProfile, player_id)
    if profile is None:
        raise ProfileNotFound
    return authorization_response(await _load_actor(session, profile))


async def set_player_roles(
    session: AsyncSession,
    player_id: str,
    role_keys: Collection[str],
    bootstrap_admin_ids: Collection[str] = (),
) -> AuthorizationResponse:
    requested = set(role_keys)
    if player_id in bootstrap_admin_ids:
        requested.add("admin")

    async with session.begin():
        profile = await session.get(PlayerProfile, player_id)
        if profile is None:
            raise ProfileNotFound
        await session.execute(delete(PlayerRole).where(PlayerRole.player_id == player_id))
        for role_key in sorted(requested):
            session.add(PlayerRole(player_id=player_id, role_key=role_key))
        profile.rank = _display_rank(requested)
        await session.flush()
        actor = await _load_actor(session, profile)

    return authorization_response(actor)
