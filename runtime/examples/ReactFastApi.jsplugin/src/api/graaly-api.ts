import { config, http, type HttpResponse } from "graaly";
import type {
  Actor,
  Authorization,
  PlayerIdentity,
  Profile,
  PurchaseBody,
  PurchaseCommand,
  PurchaseResult,
  Role,
  RoleKey,
  Session,
} from "../domain";

export interface GraalyApi {
  getAccessToken(identity: PlayerIdentity): Promise<string>;
  getActor(identity: PlayerIdentity): Promise<Actor>;
  getProfile(identity: PlayerIdentity, signal?: AbortSignal): Promise<Profile>;
  purchase(command: PurchaseCommand): Promise<PurchaseResult>;
  getRoles(identity: PlayerIdentity): Promise<Role[]>;
  getAuthorization(identity: PlayerIdentity, targetId: string): Promise<Authorization>;
  setPlayerRoles(
    identity: PlayerIdentity,
    targetId: string,
    roles: RoleKey[],
  ): Promise<Authorization>;
  forgetSession(playerId: string): void;
}

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

type CachedSession = {
  accessToken: string;
  expiresAt: number;
};

const backendUrl = String(config.get("backend.url", "http://127.0.0.1:8000")).replace(/\/$/, "");
const apiKey = String(config.get("backend.api-key", "change-me-in-production"));
const sessions = new Map<string, CachedSession>();
const pendingSessions = new Map<string, Promise<string>>();
let purchaseSequence = 0;

/** Create once per click and reuse for every retry of that logical purchase. */
export function createPurchaseKey(playerId: string): string {
  purchaseSequence = (purchaseSequence + 1) % Number.MAX_SAFE_INTEGER;
  return [
    "purchase",
    playerId,
    Date.now().toString(36),
    purchaseSequence.toString(36),
    Math.random().toString(36).slice(2, 10),
  ].join(":");
}

async function readJson<T>(response: HttpResponse): Promise<T> {
  const body = await response.json<T | { detail?: string }>();
  if (!response.ok) {
    const message = typeof body === "object" && body !== null && "detail" in body
      ? String(body.detail)
      : `FastAPI returned ${response.status}`;
    throw new ApiError(response.status, message);
  }
  return body as T;
}

async function mintSession(identity: PlayerIdentity): Promise<string> {
  const cached = sessions.get(identity.playerId);
  if (cached !== undefined && cached.expiresAt > Date.now() + 5_000) {
    return cached.accessToken;
  }
  const alreadyPending = pendingSessions.get(identity.playerId);
  if (alreadyPending !== undefined) return alreadyPending;

  const request = (async () => {
    const response = await http.post(
      `${backendUrl}/v1/auth/session`,
      {
        player_id: identity.playerId,
        player_name: identity.playerName,
      },
      { headers: { "x-graaly-key": apiKey } },
    );
    const session = await readJson<Session>(response);
    sessions.set(identity.playerId, {
      accessToken: session.access_token,
      expiresAt: Date.now() + session.expires_in * 1_000,
    });
    return session.access_token;
  })();

  pendingSessions.set(identity.playerId, request);
  try {
    return await request;
  } finally {
    pendingSessions.delete(identity.playerId);
  }
}

async function bearer(identity: PlayerIdentity): Promise<{ headers: Record<string, string> }> {
  return {
    headers: {
      authorization: `Bearer ${await mintSession(identity)}`,
    },
  };
}

export const graalyApi: GraalyApi = {
  getAccessToken: mintSession,

  async getActor(identity) {
    const response = await http.get(`${backendUrl}/v1/auth/me`, await bearer(identity));
    return readJson<Actor>(response);
  },

  async getProfile(identity, signal) {
    const options = await bearer(identity);
    const response = await http.get(
      `${backendUrl}/v1/players/${encodeURIComponent(identity.playerId)}/ui`,
      { ...options, signal },
    );
    return readJson<Profile>(response);
  },

  async purchase(command) {
    const body: PurchaseBody = { item: command.item };
    const options = await bearer(command);
    options.headers["idempotency-key"] = command.idempotencyKey;
    const response = await http.post(
      `${backendUrl}/v1/shop/purchase`,
      body,
      options,
    );
    return readJson<PurchaseResult>(response);
  },

  async getRoles(identity) {
    const response = await http.get(
      `${backendUrl}/v1/permissions/roles`,
      await bearer(identity),
    );
    return readJson<Role[]>(response);
  },

  async getAuthorization(identity, targetId) {
    const response = await http.get(
      `${backendUrl}/v1/permissions/players/${encodeURIComponent(targetId)}`,
      await bearer(identity),
    );
    return readJson<Authorization>(response);
  },

  async setPlayerRoles(identity, targetId, roles) {
    const response = await http.put(
      `${backendUrl}/v1/permissions/players/${encodeURIComponent(targetId)}/roles`,
      { roles },
      await bearer(identity),
    );
    return readJson<Authorization>(response);
  },

  forgetSession(playerId) {
    sessions.delete(playerId);
    pendingSessions.delete(playerId);
  },
};

export const apiEndpoint = backendUrl;
