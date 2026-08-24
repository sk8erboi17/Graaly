"""Create the Graaly shop and authorization schema.

Revision ID: 0001
Revises:
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "permission_definitions",
        sa.Column("key", sa.String(length=64), nullable=False),
        sa.Column("description", sa.String(length=240), nullable=False),
        sa.PrimaryKeyConstraint("key"),
    )
    op.create_table(
        "role_definitions",
        sa.Column("key", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=48), nullable=False),
        sa.PrimaryKeyConstraint("key"),
        sa.UniqueConstraint("name"),
    )
    op.create_table(
        "player_profiles",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=16), nullable=False),
        sa.Column("rank", sa.String(length=24), nullable=False),
        sa.Column("coins", sa.Integer(), nullable=False),
        sa.Column("purchases", sa.Integer(), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "role_permissions",
        sa.Column("role_key", sa.String(length=32), nullable=False),
        sa.Column("permission_key", sa.String(length=64), nullable=False),
        sa.ForeignKeyConstraint(
            ["permission_key"],
            ["permission_definitions.key"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["role_key"],
            ["role_definitions.key"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("role_key", "permission_key"),
    )
    op.create_table(
        "player_roles",
        sa.Column("player_id", sa.String(length=36), nullable=False),
        sa.Column("role_key", sa.String(length=32), nullable=False),
        sa.ForeignKeyConstraint(
            ["player_id"],
            ["player_profiles.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["role_key"],
            ["role_definitions.key"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("player_id", "role_key"),
    )
    op.create_table(
        "purchases",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("player_id", sa.String(length=36), nullable=False),
        sa.Column("item", sa.String(length=32), nullable=False),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["player_id"], ["player_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_purchases_player_id"),
        "purchases",
        ["player_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_purchases_player_id"), table_name="purchases")
    op.drop_table("purchases")
    op.drop_table("player_roles")
    op.drop_table("role_permissions")
    op.drop_table("player_profiles")
    op.drop_table("role_definitions")
    op.drop_table("permission_definitions")
