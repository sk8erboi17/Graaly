import React, { startTransition, useOptimistic, useState } from "react";
import { Item } from "@graaly/react";
import type { Player, UiAction } from "graaly";
import { createPurchaseKey, graalyApi } from "../api/graaly-api";
import type { Profile, PurchaseResult } from "../domain";

type Props = {
  player: Player;
  profile: Profile;
  onCommitted(result: PurchaseResult, action: UiAction): void;
};

/**
 * Optional React 19 pattern: show the likely balance immediately, but let the
 * parent grant the reward only from onCommitted after FastAPI has succeeded.
 */
export function OptimisticDiamond({ player, profile, onCommitted }: Props): React.ReactElement {
  const [error, setError] = useState<string | null>(null);
  const [optimisticCoins, spendOptimistically] = useOptimistic(
    profile.coins,
    (currentCoins, price: number) => Math.max(0, currentCoins - price),
  );

  function buy(action: UiAction): void {
    setError(null);
    startTransition(async () => {
      spendOptimistically(40);
      try {
        const result = await graalyApi.purchase({
          playerId: String(player.uniqueId),
          playerName: player.name,
          item: "diamond",
          idempotencyKey: createPurchaseKey(String(player.uniqueId)),
        });
        onCommitted(result, action);
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : String(failure));
      }
    });
  }

  return (
    <Item
      slot={13}
      material="DIAMOND"
      name="&bDiamond"
      lore={[error ? `&c${error}` : `&7Projected balance: &e${optimisticCoins}`]}
      onClick={buy}
    />
  );
}
