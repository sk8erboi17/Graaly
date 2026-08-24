import React from "react";
import { BossBar, Inventory, Item, Line, Message, Scoreboard, Tab } from "@graaly/react";
import { ItemStack, Material, type Player } from "graaly";
import type { Profile, Reward, ShopItem } from "../domain";
import { usePlayerProfile } from "../hooks/use-player-profile";
import { usePurchase } from "../hooks/use-purchase";
import { useRealtimeStatus } from "../hooks/use-realtime-status";
import { useShop } from "../state/shop-state";
import { createPurchaseKey } from "../api/graaly-api";
import { PermissionPanel } from "./permission-panel";

type Props = {
  player: Player;
  shopRequest: number;
  permissionRequest: {
    targetId: string;
    targetName: string;
    nonce: number;
  } | null;
};

const itemDetails = {
  diamond: { slot: 10, material: "DIAMOND", amount: 1, name: "&bDiamond", price: 40 },
  gold: { slot: 13, material: "GOLD_INGOT", amount: 4, name: "&6Gold pack", price: 25 },
  speed: { slot: 16, material: "SUGAR", amount: 1, name: "&fSpeed token", price: 15 },
} as const;

function playerId(player: Player): string {
  return String(player.uniqueId);
}

function fallbackProfile(player: Player): Profile {
  return {
    id: playerId(player),
    name: player.name,
    rank: "Loading",
    coins: 0,
    purchases: 0,
  };
}

function giveReward(player: Player, reward: Reward): void {
  const material = reward.material === "DIAMOND"
    ? Material.DIAMOND
    : reward.material === "GOLD_INGOT"
      ? Material.GOLD_INGOT
      : Material.SUGAR;
  player.inventory.addItem(new ItemStack(material, reward.amount));
}

export function PlayerInterface({
  player,
  shopRequest,
  permissionRequest,
}: Props): React.ReactElement {
  const identity = { playerId: playerId(player), playerName: player.name };
  const profileState = usePlayerProfile(identity.playerId, identity.playerName);
  const purchaseMutation = usePurchase(identity);
  const realtime = useRealtimeStatus(identity.playerId, identity.playerName);
  const { state: shop, dispatch } = useShop();
  const profile = profileState.profile ?? fallbackProfile(player);
  const pendingItem = shop.status === "purchasing" ? shop.item : null;
  const notice = shop.status === "succeeded" || shop.status === "failed"
    ? shop.notice
    : null;

  // These are projections of Profile, not duplicate state.
  const coinProgress = Math.max(0.02, Math.min(1, profile.coins / 200));
  const shopVisible = shopRequest > 0 && shop.closedRequest !== shopRequest;

  async function purchase(item: ShopItem): Promise<void> {
    if (pendingItem !== null) return;
    dispatch({ type: "purchase/started", item });

    try {
      const result = await purchaseMutation.mutateAsync({
        item,
        idempotencyKey: createPurchaseKey(identity.playerId),
      });
      profileState.replaceProfile(result.profile);
      giveReward(player, result.reward);
      dispatch({ type: "purchase/succeeded", message: result.message });
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : String(failure);
      dispatch({ type: "purchase/failed", message });
    }
  }

  return (
    <>
      {profileState.status === "error" && (
        <Message id={`profile-error-${playerId(player)}`}>&c{profileState.error.message}</Message>
      )}
      {notice && <Message id={notice.id}>{notice.text}</Message>}

      <Scoreboard title="&a&lGraaly">
        <Line id="name">&f{profile.name}</Line>
        <Line id="rank">&7Rank: &f{profile.rank}</Line>
        <Line id="coins">&7Coins: &e{profile.coins}</Line>
        <Line id="orders">&7Purchases: &b{profile.purchases}</Line>
        <Line id="api">API: {profileState.status === "error" ? "&coffline" : "&aonline"}</Line>
        <Line id="realtime">Realtime: {realtime === "online" ? "&aonline" : realtime === "connecting" ? "&econnecting" : "&coffline"}</Line>
      </Scoreboard>
      <BossBar progress={coinProgress}>&aGraaly &8• &e{profile.coins} coins</BossBar>
      <Tab header="&a&lGraaly" footer={`&7FastAPI profile • ${profile.rank}`} />

      {shopVisible && (
        <Inventory
          id={`shop-${shopRequest}`}
          title="&2Graaly shop"
          rows={3}
          onClose={() => dispatch({ type: "shop/closed", request: shopRequest })}
        >
          {(Object.entries(itemDetails) as Array<[ShopItem, (typeof itemDetails)[ShopItem]]>).map(
            ([item, details]) => (
              <Item
                key={item}
                slot={details.slot}
                material={details.material}
                amount={details.amount}
                name={details.name}
                lore={[
                  `&7Price: &e${details.price} coins`,
                  pendingItem === item ? "&eLoading…" : "&aClick to buy",
                ]}
                onClick={() => purchase(item)}
              />
            ),
          )}
        </Inventory>
      )}
      {permissionRequest !== null && (
        <PermissionPanel
          identity={identity}
          targetId={permissionRequest.targetId}
          targetName={permissionRequest.targetName}
          nonce={permissionRequest.nonce}
        />
      )}
    </>
  );
}
