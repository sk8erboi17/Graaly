import type { ReactNode } from "react";
import {
  React as ReactRuntime,
  createRoot,
  type GraalyCommit,
  type GraalyRoot,
  type GraalyUiTransport,
  type UiAction,
} from "@graaly/react";

declare function setTimeout(callback: () => void, milliseconds?: number): number;

export interface GraalyTestPlayer {
  readonly id: string;
  readonly name: string;
}

export interface GraalyTestRenderOptions {
  readonly player?: GraalyTestPlayer;
  readonly historyLimit?: number;
}

export interface GraalyTestView {
  readonly player: GraalyTestPlayer;
  readonly root: GraalyRoot;
  readonly snapshot: Readonly<Record<string, unknown>>;
  readonly commits: readonly GraalyCommit[];
  clickSlot(slot: number, action?: Partial<UiAction>): Promise<void>;
  closeInventory(): Promise<void>;
  submitInput(value: string): Promise<void>;
  cancelInput(): Promise<void>;
  rerender(children: ReactNode): Promise<void>;
  unmount(): Promise<void>;
}

interface InventorySnapshot {
  readonly id: string;
  readonly closeActionId?: string;
  readonly items: readonly { readonly slot: number; readonly actionId?: string }[];
}

interface InputSnapshot {
  readonly id: string;
  readonly submitActionId?: string;
  readonly cancelActionId?: string;
  readonly value?: string;
}

const tick = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0));
const { act } = ReactRuntime;

const actionPlayer = (player: GraalyTestPlayer): UiAction["player"] => ({
  id: player.id,
  name: player.name,
});

/**
 * Render a Graaly React tree without a server. The test transport records the
 * exact immutable snapshot that production sends to Minecraft.
 */
export async function render(
  children: ReactNode,
  options: GraalyTestRenderOptions = {},
): Promise<GraalyTestView> {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const player = options.player ?? { id: "test-player", name: "TestPlayer" };
  let current: Readonly<Record<string, unknown>> | null = null;
  let receiver: ((action: UiAction) => unknown) | null = null;
  const transport: GraalyUiTransport = {
    render(_player, snapshot, onAction) {
      current = snapshot;
      receiver = onAction ?? null;
    },
    clear() {
      current = null;
      receiver = null;
    },
    dismiss(_player, surface) {
      if (current == null) return;
      current = Object.freeze({ ...current, [surface]: null });
    },
  };
  const root = createRoot(player as never, {
    transport,
    historyLimit: options.historyLimit,
  });

  const dispatch = async (action: UiAction): Promise<void> => {
    if (receiver == null) throw new Error("The Graaly tree has no active action receiver");
    await act(async () => {
      await Promise.resolve(receiver?.(action));
      await tick();
    });
  };

  const requireSnapshot = (): Readonly<Record<string, unknown>> => {
    if (current == null) throw new Error("The Graaly test tree is not mounted");
    return current;
  };

  await act(async () => {
    root.render(children);
    await tick();
  });

  return {
    player,
    root,
    get snapshot() {
      return requireSnapshot();
    },
    get commits() {
      return root.getCommits();
    },
    async clickSlot(slot, selected = {}) {
      const inventory = requireSnapshot().inventory as InventorySnapshot | null;
      if (inventory == null) throw new Error("No Inventory is currently rendered");
      const item = inventory.items.find(candidate => candidate.slot === slot);
      if (item?.actionId == null || item.actionId === "") {
        throw new Error(`Inventory slot ${slot} has no click handler`);
      }
      await dispatch({
        type: "inventory.click",
        viewId: inventory.id,
        actionId: item.actionId,
        slot,
        click: "LEFT",
        shift: false,
        right: false,
        player: actionPlayer(player),
        ...selected,
      });
    },
    async closeInventory() {
      const inventory = requireSnapshot().inventory as InventorySnapshot | null;
      if (inventory == null) throw new Error("No Inventory is currently rendered");
      await dispatch({
        type: "inventory.close",
        viewId: inventory.id,
        actionId: inventory.closeActionId,
        player: actionPlayer(player),
      });
    },
    async submitInput(value) {
      const input = requireSnapshot().input as InputSnapshot | null;
      if (input?.submitActionId == null || input.submitActionId === "") {
        throw new Error("No ChatInput submit handler is currently rendered");
      }
      await dispatch({
        type: "input.submit",
        viewId: input.id,
        actionId: input.submitActionId,
        value,
        player: actionPlayer(player),
      });
    },
    async cancelInput() {
      const input = requireSnapshot().input as InputSnapshot | null;
      if (input?.cancelActionId == null || input.cancelActionId === "") {
        throw new Error("No ChatInput cancel handler is currently rendered");
      }
      await dispatch({
        type: "input.cancel",
        viewId: input.id,
        actionId: input.cancelActionId,
        value: input.value,
        player: actionPlayer(player),
      });
    },
    async rerender(next) {
      await act(async () => {
        root.render(next);
        await tick();
      });
    },
    async unmount() {
      await act(async () => {
        root.unmount();
        await tick();
      });
    },
  };
}
