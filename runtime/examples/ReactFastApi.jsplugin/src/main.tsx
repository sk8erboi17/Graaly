import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot, type GraalyRoot } from "@graaly/react";
import {
  commands,
  events,
  info,
  PlayerJoinEvent,
  PlayerQuitEvent,
  players,
  type Player,
} from "graaly";
import { apiEndpoint, graalyApi } from "./api/graaly-api";
import { PlayerInterface } from "./components/player-interface";
import { ShopProvider } from "./state/shop-state";

type RootState = {
  root: GraalyRoot;
  queryClient: QueryClient;
  shopRequest: number;
  permissionRequest: {
    targetId: string;
    targetName: string;
    nonce: number;
  } | null;
};

const roots = new Map<string, RootState>();

function playerId(player: Player): string {
  return String(player.uniqueId);
}

function renderPlayer(
  player: Player,
  openShop = false,
  permissionTarget?: Player,
): void {
  const id = playerId(player);
  const state = roots.get(id) ?? {
    root: createRoot(player),
    queryClient: new QueryClient({
      defaultOptions: {
        queries: { retry: 1, gcTime: 60_000 },
        mutations: { retry: 0 },
      },
    }),
    shopRequest: 0,
    permissionRequest: null,
  };
  if (openShop) state.shopRequest += 1;
  if (permissionTarget !== undefined) {
    state.permissionRequest = {
      targetId: playerId(permissionTarget),
      targetName: permissionTarget.name,
      nonce: (state.permissionRequest?.nonce ?? 0) + 1,
    };
  }
  roots.set(id, state);
  state.root.render(
    <QueryClientProvider client={state.queryClient}>
      <ShopProvider>
        <PlayerInterface
          player={player}
          shopRequest={state.shopRequest}
          permissionRequest={state.permissionRequest}
        />
      </ShopProvider>
    </QueryClientProvider>,
  );
}

events.on(PlayerJoinEvent, event => renderPlayer(event.player));
events.on(PlayerQuitEvent, event => {
  const state = roots.get(playerId(event.player));
  state?.root.unmount();
  state?.queryClient.clear();
  graalyApi.forgetSession(playerId(event.player));
  roots.delete(playerId(event.player));
});

commands.on("graalypermissions", context => {
  if (!players.isPlayer(context.sender)) {
    context.reply("Players only.");
    return true;
  }
  const targetName = context.args[0];
  const target = targetName === undefined ? context.sender : players.exact(targetName);
  if (target === null) {
    context.reply("&cThat player must be online.");
    return true;
  }
  renderPlayer(context.sender, false, target);
  return true;
});

commands.on("graalyui", context => {
  if (!players.isPlayer(context.sender)) {
    context.reply("Players only.");
    return true;
  }
  renderPlayer(context.sender, true);
  return true;
});

export function onEnable(): void {
  for (const player of players.online()) renderPlayer(player);
  info(`React UI ready; FastAPI endpoint: ${apiEndpoint}`);
}

export function onDisable(): void {
  for (const [id, state] of roots) {
    state.root.unmount();
    state.queryClient.clear();
    graalyApi.forgetSession(id);
  }
  roots.clear();
}
