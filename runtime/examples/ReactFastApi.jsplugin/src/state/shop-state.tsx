import React, {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type PropsWithChildren,
} from "react";
import type { ShopItem } from "../domain";

type ShopBase = { closedRequest: number };
export type ShopState =
  | (ShopBase & { status: "idle" })
  | (ShopBase & { status: "purchasing"; item: ShopItem })
  | (ShopBase & { status: "succeeded"; notice: { id: string; text: string } })
  | (ShopBase & { status: "failed"; notice: { id: string; text: string } });

export type ShopAction =
  | { type: "shop/closed"; request: number }
  | { type: "purchase/started"; item: ShopItem }
  | { type: "purchase/succeeded"; message: string }
  | { type: "purchase/failed"; message: string };

export const initialShopState: ShopState = {
  closedRequest: 0,
  status: "idle",
};

export function shopReducer(state: ShopState, action: ShopAction): ShopState {
  switch (action.type) {
    case "shop/closed":
      return { ...state, closedRequest: action.request };
    case "purchase/started":
      return {
        status: "purchasing",
        item: action.item,
        closedRequest: state.closedRequest,
      };
    case "purchase/succeeded":
      return {
        status: "succeeded",
        closedRequest: state.closedRequest,
        notice: { id: `purchase-${Date.now()}`, text: `&a${action.message}` },
      };
    case "purchase/failed":
      return {
        status: "failed",
        closedRequest: state.closedRequest,
        notice: { id: `purchase-error-${Date.now()}`, text: `&c${action.message}` },
      };
  }
}

type ShopContextValue = {
  state: ShopState;
  dispatch: Dispatch<ShopAction>;
};

const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({ children }: PropsWithChildren): React.ReactElement {
  const [state, dispatch] = useReducer(shopReducer, initialShopState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopContextValue {
  const value = useContext(ShopContext);
  if (value === null) throw new Error("useShop must be used inside ShopProvider");
  return value;
}
