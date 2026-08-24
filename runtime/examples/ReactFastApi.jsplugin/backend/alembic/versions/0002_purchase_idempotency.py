"""Make shop purchases replay-safe.

Revision ID: 0002
Revises: 0001
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("purchases") as batch:
        batch.add_column(sa.Column("idempotency_key", sa.String(length=128), nullable=True))
        batch.add_column(sa.Column("response_json", sa.Text(), nullable=True))

    # Historical rows had no client key and can never be replayed. Give each
    # one a collision-free internal key so the new invariant also holds for an
    # existing database.
    op.execute(
        sa.text(
            "UPDATE purchases "
            "SET idempotency_key = 'legacy:' || CAST(id AS VARCHAR), response_json = '{}' "
            "WHERE idempotency_key IS NULL"
        )
    )

    with op.batch_alter_table("purchases") as batch:
        batch.alter_column("idempotency_key", existing_type=sa.String(length=128), nullable=False)
        batch.alter_column("response_json", existing_type=sa.Text(), nullable=False)
        batch.create_unique_constraint(
            "uq_purchases_player_id_idempotency_key",
            ["player_id", "idempotency_key"],
        )


def downgrade() -> None:
    with op.batch_alter_table("purchases") as batch:
        batch.drop_constraint("uq_purchases_player_id_idempotency_key", type_="unique")
        batch.drop_column("response_json")
        batch.drop_column("idempotency_key")
