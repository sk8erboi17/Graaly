// @ts-check
import { config, http } from "graaly";

/**
 * @typedef {"member" | "moderator" | "admin"} Role
 * @typedef {{ playerId: string, playerName: string }} Identity
 * @typedef {{ access_token: string, expires_in: number }} Session
 * @typedef {{ player_id: string, player_name: string, roles: Role[], permissions: string[] }} Authorization
 */

const baseUrl = String(config.get("backend.url", "http://127.0.0.1:8000"));
const serviceKey = String(config.get("backend.api-key", ""));

/**
 * The service key is used only for the trusted server-to-server exchange.
 * @param {Identity} identity
 */
export async function openSession(identity) {
  const response = await http.post(
    `${baseUrl}/v1/auth/session`,
    { player_id: identity.playerId, player_name: identity.playerName },
    { headers: { "x-graaly-key": serviceKey } },
  );
  if (!response.ok) {
    throw new Error("Session exchange failed", {
      cause: await response.text(),
    });
  }
  /** @type {Session} */
  const session = await response.json();
  return session.access_token;
}

/**
 * @param {Identity} actor
 * @param {string} targetId
 * @param {Role[]} roles
 * @returns {Promise<Authorization>}
 */
export async function replaceRoles(actor, targetId, roles) {
  const token = await openSession(actor);
  const response = await http.put(
    `${baseUrl}/v1/permissions/players/${encodeURIComponent(targetId)}/roles`,
    { roles },
    { headers: { authorization: `Bearer ${token}` } },
  );
  if (!response.ok) throw new Error(`Permission update failed: ${response.status}`);
  return response.json();
}
