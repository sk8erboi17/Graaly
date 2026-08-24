import type { components } from "./api/generated-schema";

type Schemas = components["schemas"];

/** These domain values come directly from FastAPI's generated OpenAPI schema. */
export type ShopItem = Schemas["PurchaseRequest"]["item"];
export type Profile = Schemas["ProfileResponse"];
export type Reward = Schemas["Reward"];
export type PurchaseResult = Schemas["PurchaseResponse"];
export type PurchaseBody = Schemas["PurchaseRequest"];
export type RealtimeClientMessage = Schemas["RealtimeClientMessage"];
export type RealtimeServerMessage = Schemas["RealtimeServerMessage"];
export type Actor = Schemas["ActorResponse"];
export type Authorization = Schemas["AuthorizationResponse"];
export type Role = Schemas["RoleResponse"];
export type RoleKey = Schemas["SetPlayerRolesRequest"]["roles"][number];
export type Session = Schemas["SessionResponse"];

export type PlayerIdentity = {
  playerId: string;
  playerName: string;
};

export type PurchaseCommand = PlayerIdentity & {
  item: ShopItem;
  idempotencyKey: string;
};

export type PurchaseIntent = Pick<PurchaseCommand, "item" | "idempotencyKey">;
