import { useEffect, useState } from "react";
import { config, websocket, type WebSocketConnection } from "graaly";
import { graalyApi } from "../api/graaly-api";
import type { RealtimeClientMessage, RealtimeServerMessage } from "../domain";


type RealtimeStatus = "connecting" | "online" | "offline";

const httpUrl = String(config.get("backend.url", "http://127.0.0.1:8000")).replace(/\/$/, "");
const socketUrl = httpUrl.replace(/^http:/, "ws:").replace(/^https:/, "wss:");

function reconnectDelay(attempt: number): number {
  const cap = Math.min(30_000, 500 * 2 ** attempt);
  return Math.floor(cap * (0.5 + Math.random() * 0.5));
}

export function useRealtimeStatus(playerId: string, playerName: string): RealtimeStatus {
  const [status, setStatus] = useState<RealtimeStatus>("connecting");

  useEffect(() => {
    let disposed = false;
    let connection: WebSocketConnection | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    let unsubscribers: Array<() => void> = [];

    const clearListeners = () => {
      for (const unsubscribe of unsubscribers) unsubscribe();
      unsubscribers = [];
    };

    const scheduleReconnect = () => {
      if (disposed || reconnectTimer !== null) return;
      setStatus("offline");
      const delay = reconnectDelay(attempt++);
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        void connect();
      }, delay);
    };

    const connect = async () => {
      setStatus("connecting");
      try {
        const token = await graalyApi.getAccessToken({ playerId, playerName });
        const socket = await websocket.connect(
          `${socketUrl}/v1/realtime/${encodeURIComponent(playerId)}`,
          {
            headers: { authorization: `Bearer ${token}` },
            timeout: 10_000,
          },
        );
        if (disposed) {
          await socket.close();
          return;
        }

        connection = socket;
        attempt = 0;
        clearListeners();
        unsubscribers = [
          socket.onMessage(raw => {
            const event = JSON.parse(raw) as RealtimeServerMessage;
            if (event.type === "pong") setStatus("online");
          }),
          socket.onClose(() => {
            connection = null;
            clearListeners();
            scheduleReconnect();
          }),
          socket.onError(() => {
            setStatus("offline");
            void socket.close();
          }),
        ];
        const ping: RealtimeClientMessage = {
          type: "ping",
          request_id: `plugin-${playerId}`,
        };
        await socket.sendJson(ping);
      } catch {
        if (!disposed) scheduleReconnect();
      }
    };

    void connect();
    return () => {
      disposed = true;
      if (reconnectTimer !== null) clearTimeout(reconnectTimer);
      clearListeners();
      if (connection !== null) void connection.close();
    };
  }, [playerId, playerName]);

  return status;
}
