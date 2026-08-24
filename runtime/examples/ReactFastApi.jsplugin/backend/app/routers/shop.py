from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, status

from .. import services
from ..auth import ActorContext, SHOP_PURCHASE
from ..dependencies import SessionDep, require_permission
from ..schemas import PurchaseRequest, PurchaseResponse


router = APIRouter(
    prefix="/v1/shop",
    tags=["shop"],
)
CanPurchase = Annotated[ActorContext, Depends(require_permission(SHOP_PURCHASE))]
IdempotencyKey = Annotated[
    str,
    Header(
        alias="Idempotency-Key",
        min_length=8,
        max_length=128,
        pattern=r"^[A-Za-z0-9._:-]+$",
    ),
]


@router.post("/purchase", response_model=PurchaseResponse)
async def purchase(
    command: PurchaseRequest,
    actor: CanPurchase,
    session: SessionDep,
    idempotency_key: IdempotencyKey,
) -> PurchaseResponse:
    try:
        return await services.purchase_item(session, actor, command, idempotency_key)
    except services.InsufficientCoins as error:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Not enough coins",
        ) from error
    except services.IdempotencyConflict as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Idempotency-Key was already used for a different purchase",
        ) from error
