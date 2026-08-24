# Graaly React + FastAPI example

This example keeps live game state in a small TypeScript adapter, renders each player's interface with real React, and stores application data in a separate CPython FastAPI service with async SQLAlchemy. Its folders intentionally use ordinary React and FastAPI architecture so the same patterns transfer to other projects.

## Read the architecture

```text
src/
├── api/graaly-api.ts              JWT session exchange + typed HTTP boundary
├── api/generated-schema.ts       generated from FastAPI OpenAPI
├── hooks/use-player-profile.ts   TanStack Query server state
├── hooks/use-purchase.ts         optimistic mutation + rollback/invalidation
├── hooks/use-realtime-status.ts  WebSocket effect + race-safe cleanup
├── state/shop-state.tsx          reducer + Context
├── components/permission-panel.tsx React RBAC editor
├── components/player-interface.tsx
├── learning/optimistic-diamond.tsx  optional React 19 useOptimistic example
├── domain.ts                     data contracts
└── main.tsx                      game lifecycle adapter only

backend/app/
├── auth.py                       short JWT identities + role catalog
├── dependencies.py               request session + live permission guards
├── routers/                      thin HTTP routes
├── services.py                   transactions and business rules
├── schemas.py                    Pydantic boundary models
├── models.py                     SQLAlchemy persistence models
└── main.py                       app factory + lifespan
```

Start with `domain.ts` and `schemas.py`, then follow one read request through the custom Hook and players router. After that, follow one purchase through the click handler, API client, shop router, and transactional service.

## Build the plugin

```bash
npm ci
npm --prefix tools/openapi ci
npm run generate:api
npm run build
```

`generate:api` exports FastAPI's authoritative Pydantic/OpenAPI schema and turns it into TypeScript. `domain.ts` aliases those generated models, so a Python response change becomes a TypeScript compile error instead of a runtime surprise. The code generator is isolated under `tools/openapi` because its current peer range uses TypeScript 5 while the plugin itself compiles with TypeScript 7.

Place the `ReactFastApi.jsplugin` directory under the server's `plugins/` directory. On first load, Graaly copies `config.yml` to the separate `plugins/ReactFastApi/config.yml` data directory. Set a long service key there. It is used only to exchange the trusted in-game player identity for a short-lived bearer session; protected API and WebSocket calls never reuse the service key.

## Start the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e '.[test]'
GRAALY_DATABASE_URL='sqlite+aiosqlite:///./graaly-ui.db' alembic upgrade head
GRAALY_API_KEY='the-same-long-service-secret' \
GRAALY_JWT_SECRET='a-separate-random-secret-of-at-least-32-bytes' \
GRAALY_ADMIN_PLAYER_IDS='your-player-uuid' \
GRAALY_AUTO_CREATE_SCHEMA=false \
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

For disposable development, `GRAALY_AUTO_CREATE_SCHEMA=true` can create `graaly-ui.db`. Durable environments should run the checked-in Alembic migration and disable automatic creation. Set `GRAALY_DATABASE_URL` to an async PostgreSQL URL in production and add the matching driver. Keep the API on `127.0.0.1` when it runs on the same host.

Start the game server and use `/graalyui`. An ID listed in `GRAALY_ADMIN_PLAYER_IDS` can use `/graalypermissions [online player]`. The roles are:

- `member`: profile, shop, and realtime access;
- `moderator`: profile, realtime, and permission inspection;
- `admin`: every permission, including role assignment.

FastAPI reloads role assignments on every protected request, so changing a role revokes an existing session immediately. React only projects that policy; `require_permission(...)` is the authoritative guard.

Buying an item follows this path:

1. the inventory click reaches the React `onClick` handler;
2. Graaly performs a non-blocking HTTP request;
3. FastAPI resolves the bearer actor and live `shop.purchase` permission, then Pydantic validates the command;
4. the service conditionally debits the balance with one atomic `UPDATE` and records the purchase in the same transaction;
5. the continuation returns on the safe server thread, grants the reward, and replaces the authoritative React profile.

The profile uses TanStack Query rather than duplicated component state. The purchase mutation cancels overlapping reads, snapshots the cache, renders an optimistic balance, rolls back on failure, replaces it with the authoritative response, and invalidates after settlement. Rewards are never granted from optimistic state.

The scoreboard also opens a bearer-authenticated WebSocket and shows its status. Its Effect closes the socket during cleanup and ignores a late connection, which is the same race-safe lifecycle pattern used by browser React—only the rendered host is Minecraft UI.

Run `npm run build` for strict TypeScript checking and `.venv/bin/python -m pytest -q` for identity exchange, least privilege, admin assignment, immediate revocation, cross-player denial, WebSocket identity, failed transactions, Alembic migration, OpenAPI drift, middleware, and dependency-override tests. `clients/` contains equivalent checked JavaScript and Python permission clients.
