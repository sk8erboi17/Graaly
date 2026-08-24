from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class PlayerProfile(Base):
    __tablename__ = "player_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(16))
    rank: Mapped[str] = mapped_column(String(24), default="Member")
    coins: Mapped[int] = mapped_column(Integer, default=150)
    purchases: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Purchase(Base):
    __tablename__ = "purchases"
    __table_args__ = (
        UniqueConstraint(
            "player_id",
            "idempotency_key",
            name="uq_purchases_player_id_idempotency_key",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    player_id: Mapped[str] = mapped_column(ForeignKey("player_profiles.id"), index=True)
    item: Mapped[str] = mapped_column(String(32))
    price: Mapped[int] = mapped_column(Integer)
    idempotency_key: Mapped[str] = mapped_column(String(128))
    response_json: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PermissionDefinition(Base):
    __tablename__ = "permission_definitions"

    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    description: Mapped[str] = mapped_column(String(240))


class RoleDefinition(Base):
    __tablename__ = "role_definitions"

    key: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(48), unique=True)


class RolePermission(Base):
    __tablename__ = "role_permissions"

    role_key: Mapped[str] = mapped_column(
        ForeignKey("role_definitions.key", ondelete="CASCADE"),
        primary_key=True,
    )
    permission_key: Mapped[str] = mapped_column(
        ForeignKey("permission_definitions.key", ondelete="CASCADE"),
        primary_key=True,
    )


class PlayerRole(Base):
    __tablename__ = "player_roles"

    player_id: Mapped[str] = mapped_column(
        ForeignKey("player_profiles.id", ondelete="CASCADE"),
        primary_key=True,
    )
    role_key: Mapped[str] = mapped_column(
        ForeignKey("role_definitions.key", ondelete="CASCADE"),
        primary_key=True,
    )
