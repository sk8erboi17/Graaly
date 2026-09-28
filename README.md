# Graaly

Graaly is a standalone Minecraft plugin runtime for JavaScript, TypeScript, Python, and sandboxed C/WebAssembly. It downloads release-pinned Graal language artifacts on first start. All four surfaces resolve the same canonical Minecraft contract from 1.7.10 through 26.2; C exposes it through a deliberately low-level ABI that teaches real data layout, pointers, callbacks, ownership, and memory while Graaly translates host/server differences behind the boundary.

- TypeScript and JavaScript import from `"graaly"`.
- Python imports from `graaly`.
- C includes `graaly/graaly.h`, defines its own domain structs, and compiles to a `.wasm` inside a `.cplugin` bundle.
- No Java class paths or interop helpers are required in normal plugin code.
- The public contract is generated from the 26.2 API and stays identical on every supported server.
- Renamed types, constants, and equivalent mechanics are adapted internally.
- A mechanic that truly does not exist on an older version raises `GraalyUnsupportedFeature`; Graaly never pretends that it worked.

Documentation: **[sk8erboi17.github.io/Graaly](https://sk8erboi17.github.io/Graaly/)**

## Prerequisites

Install these before starting the quick start:

| Required for | Prerequisite |
|---|---|
| Running Graaly | Java 17 or newer, using a JVM version supported by your server release |
| Building Graaly | Maven 3.9 or newer |
| JavaScript / TypeScript development | Node.js 22.13 or newer and npm |
| Python tooling and FastAPI examples | Python 3.12 or newer |
| C plugin development | Zig 0.16+ (reference toolchain), or Clang with a WASI SDK |
| Historical launchers on modern Java | The matching `graaly-<version>-legacy-launcher-agent.jar` release asset |
| Packet API, when used | PacketEvents 2.13.0 installed separately |

GraalJS, GraalPy, and GraalWasm language implementations are **not embedded** in the Graaly plugin JAR. On first start Graaly downloads only the enabled, release-pinned language artifacts from Maven Central into `plugins/Graaly/runtime/25.2.4/`, verifies their exact size and SHA-256, and reuses that cache on later starts. The first online start therefore needs outbound HTTPS access unless an administrator pre-populates the verified cache. Node.js and system Python are development tools; they do not execute plugins inside the server. Vanilla server JARs do not provide a plugin loader and cannot load Graaly. No server, PacketEvents, GraalJS, or GraalPy JAR is redistributed by this project.

Java 17 is the functional minimum for Graaly, not a promise that every game-server release can run on Java 17: use the JVM required by that server release. With the pinned Graal 25.2.4 runtime, Java 25 can use Graal's optimized execution path. Java 17–24 and Java 26 remain supported and pass the same API tests, but run guest code through Graal's interpreter fallback and can be slower. Graaly reports the fallback warning at startup instead of hiding that trade-off.

## Repository layout

| Path | Purpose |
|---|---|
| [`runtime/`](runtime/) | Standalone Java 17+ runtime, GraalJS/GraalPy/GraalWasm support, SDKs, contracts, examples, and matrix harness |
| [`app/`](app/) | Responsive Graaly documentation and searchable API reference |
| [`runtime/sdk/typescript/`](runtime/sdk/typescript/) | TypeScript/JavaScript package imported as `graaly` |
| [`runtime/sdk/python/graaly/`](runtime/sdk/python/graaly/) | Python stubs and native facade imported as `graaly` |
| [`runtime/sdk/c/`](runtime/sdk/c/) | C ABI v1, headers, runtime shim, build instructions, and memory-learning helpers |
| [`runtime/examples/`](runtime/examples/) | Working JS, TS, Python, C/Wasm, PacketEvents, worlds, HTML/CSS GUI, React UI, FastAPI, and board examples |
| [`runtime/contract/`](runtime/contract/) | Machine-readable stable API, canonical constants, members, and capability policy |

No Minecraft server JAR is stored or redistributed by this repository.

## What “one stable API” means

Plugin source never imports a game version:

```ts
import {
  EntityTypes,
  Materials,
  PlayerJoinEvent,
  entities,
  events,
  worlds,
} from "graaly";

events.on(PlayerJoinEvent, event => {
  const location = worlds.location(event.player.world, 0.5, 65, 0.5);
  entities.spawn(location, EntityTypes.ARMOR_STAND, {
    customName: "Guide",
    customNameVisible: true,
  });

  event.player.sendMessage(`&aGraaly loaded ${Materials.STONE.name}`);
});
```

```py
from graaly import EntityTypes, Materials, PlayerJoinEvent, entities, event, worlds


@event(PlayerJoinEvent)
def on_join(join):
    location = worlds.location(join.player.world, 0.5, 65, 0.5)
    entities.spawn(
        location,
        EntityTypes.ARMOR_STAND,
        custom_name="Guide",
        custom_name_visible=True,
    )
    join.player.send_message(f"&aGraaly loaded {Materials.STONE.name}")
```

In JavaScript, TypeScript, and Python scripts, Graaly automatically translates `&` color codes passed to `CommandSender.sendMessage` (including `Player`), `context.reply`, and `players.broadcast`. Use `text.color(...)` when another Bukkit API expects an already-colored string.

Graaly exposes Java-backed object state only through the native property style of each language. In TypeScript and JavaScript write `player.allowFlight = true` and read `player.flying`; in Python use `player.allow_flight = True` and `player.flying`. Instance accessors such as `setAllowFlight(...)`, `isFlying()`, `set_allow_flight(...)`, and `is_flying()` are intentionally not part of the scripting API. Real methods that perform an operation or accept domain arguments, such as `player.hasPermission(node)` and `world.getBlockAt(x, y, z)`, remain methods (`has_permission` and `get_block_at` in Python).

The editor always exposes the same symbols and signatures. At runtime Graaly resolves the actual server type, walks legacy aliases, and adapts known renames. Capability checks are explicit when gameplay semantics changed:

The canonical `EntityTypes` catalog is type-aware: `entities.spawn(location, EntityTypes.ZOMBIE)` is inferred as `Zombie`, while `EntityTypes.HORSE` returns `Horse`. All 159 current entity constants carry the corresponding TypeScript and Python editor type without a cast.

```ts
import { compatibility } from "graaly";

if (compatibility.supports("display_entities")) {
  // Safe on versions that implement this mechanic.
}
```

```py
from graaly import GraalyUnsupportedFeature, compatibility

try:
    compatibility.require("display_entities")
except GraalyUnsupportedFeature as unavailable:
    print(unavailable.feature, unavailable.minecraft_version)
```

An ordinary typo remains an ordinary missing property. Only a real member from the canonical Graaly contract that is absent on the current server becomes `GraalyUnsupportedFeature`, so errors stay actionable.

## Build the runtime

```bash
cd runtime
mvn clean package
```

The build produces two files in `runtime/target/`:

- `Graaly-<version>.jar`: place this in the server `plugins/` directory;
- `graaly-<version>-legacy-launcher-agent.jar`: pass this only when a historical launcher rejects a newer JVM before plugins load.

Recommended launch shape:

```bash
java \
  -javaagent:graaly-1.0.0-legacy-launcher-agent.jar \
  -jar server.jar nogui
```

The agent only adjusts legacy launcher compatibility. Graaly itself remains a normal standalone plugin.

## First-start runtime and configuration

The first successful start creates this dedicated layout:

```text
plugins/
├── Graaly-1.0.0.jar
└── Graaly/
    ├── config.yml
    ├── runtime/25.2.4/      # verified GraalJS/GraalPy/GraalWasm cache
    └── scripts/             # your .jsplugin, .pyplugin, and .cplugin bundles
```

The generated configuration is intentionally small:

```yaml
runtime:
  auto-download: true
  languages:
    javascript: true
    python: true
    c: true
  connect-timeout-seconds: 20
  request-timeout-seconds: 180
  retry-attempts: 2
```

- Disable a language to avoid downloading and loading it when the server will not use it.
- Set `auto-download: false` for an offline/locked-down server after copying the complete verified `runtime/25.2.4/` directory from another Graaly installation.
- A missing, truncated, or SHA-mismatched file is never loaded. With automatic downloads enabled, Graaly preserves it as `.invalid-<timestamp>` and installs the pinned artifact again.
- URLs, filenames, sizes, and hashes belong to the Graaly release; `config.yml` cannot redirect downloads to an arbitrary repository.

## Create a plugin

Graaly discovers bundles in `plugins/Graaly/scripts/`.

### TypeScript

```text
Hello.jsplugin/
├── plugin.yml
├── package.json
├── tsconfig.json
└── src/main.mts
```

`plugin.yml` points at the bundled ESM file:

```yaml
name: Hello
version: 1.0.0
main: dist/main.mjs
commands:
  hello:
    description: Say hello
```

Use the local SDK package and compile with standard TypeScript tooling:

```json
{
  "type": "module",
  "dependencies": {
    "graaly": "file:../../sdk/typescript"
  },
  "scripts": {
    "build": "esbuild src/main.mts --bundle --platform=neutral --format=esm --target=es2024 --outfile=dist/main.mjs"
  }
}
```

Command handlers may live in separate modules. Import each module from the bundled entry point so esbuild includes and evaluates its registrations:

```ts
// src/main.mts
import "./commands/fly.mts";
```

The module can register its handler at top level with `commands.on("fly", handler)`, while `plugin.yml` declares the same `fly` name under `commands`. After `npm run build`, `/graaly reload` re-reads `plugin.yml` and synchronizes added, removed, or edited command names, aliases, usage, and permissions without restarting the server. Structural changes to `name`, `main`, `depend`, `softdepend`, or `loadbefore` still require a full restart.

See [`runtime/examples/TypeScriptHello.jsplugin`](runtime/examples/TypeScriptHello.jsplugin/).

### JavaScript

JavaScript bundles use the same `.jsplugin` directory and the same imports. Type information is available through the included package even when the entry file is plain `.mjs`.

See [`runtime/examples/JavaScriptHello.jsplugin`](runtime/examples/JavaScriptHello.jsplugin/).

### Python

```text
Hello.pyplugin/
├── plugin.yml
└── main.py
```

```yaml
name: HelloPy
version: 1.0.0
main: main.py
commands:
  hello:
    description: Say hello
```

Python uses decorators, snake_case properties, native collections, exceptions, and real `async`/`await`:

```py
from graaly import PlayerJoinEvent, event, tasks


@event(PlayerJoinEvent)
async def on_join(join):
    await tasks.sleep_ticks(20)
    join.player.send_message("One second later")
```

See [`runtime/examples/PythonHello.pyplugin`](runtime/examples/PythonHello.pyplugin/) and [`runtime/examples/PythonAsync.pyplugin`](runtime/examples/PythonAsync.pyplugin/).

### C / WebAssembly

C plugins are compiled before deployment and use a `.cplugin` directory:

```text
EducationalC.cplugin/
├── plugin.yml
├── src/main.c
└── dist/plugin.wasm
```

Graaly intentionally does not hand C code a generated `Player` struct. The developer defines the representation and copies only the fields they want:

```c
#include <graaly/graaly.h>

typedef struct Player {
    graaly_player_handle_t handle;
    char name[32];
    double health;
    int level;
} Player;

static bool player_snapshot(graaly_player_handle_t handle, Player *out) {
    if (out == NULL || handle == 0) return false;
    memset(out, 0, sizeof *out);
    out->handle = handle;
    graaly_player_read_name(handle, out->name, sizeof out->name);
    out->health = graaly_player_health(handle);
    out->level = graaly_player_level(handle);
    return true;
}
```

The C ABI uses wasm32 linear memory, explicit pointer+length calls, C function pointers for callbacks, and checked 64-bit host handles. It now covers the full canonical Graaly surface: the generated `catalog.h` currently contains 1,421 exported types, 63,044 canonical member references and 4,629 constants, while named C facades cover all 14 public modules. `graaly_type`, `graaly_get`, `graaly_set`, `graaly_call`, `graaly_construct`, collection/map helpers and the module APIs all use the same version adapter as JS/Python. Invalid linear-memory accesses trap inside WebAssembly rather than becoming arbitrary JVM pointers. The optional teaching heap adds 16-byte `DEADBEEF` red zones, buffer under/overflow checks, invalid/double-free diagnostics, logical-free poisoning, and quarantine until disable. See [`runtime/sdk/c/README.md`](runtime/sdk/c/README.md) and [`runtime/examples/EducationalC.cplugin`](runtime/examples/EducationalC.cplugin/).

## PacketEvents

PacketEvents remains a separate optional plugin. When present, Graaly exposes named constants, typed wrappers, send/receive listeners, cancellation, and client metadata through JS/TS/Python imports and the C packet facade.

```ts
import { ClientPacket, WrapperPlayClientChatMessage, packets } from "graaly";

packets.onReceive(ClientPacket.CHAT_MESSAGE, context => {
  const chat = context.wrap(WrapperPlayClientChatMessage);
  if (chat.message.toLowerCase() === "stop") context.cancel();
});
```

Packet callbacks must finish synchronously because the networking pipeline consumes their result immediately. Schedule later world or entity work through `tasks`; do not return a Promise from a packet listener.

The documented provider baseline is PacketEvents 2.13.0. It is not bundled or redistributed. After downloading it from the official project, reproduce the current-boundary integration report with:

```bash
cd runtime
python3 scripts/test_packetevents.py \
  26.2 /absolute/path/to/spigot-26.2.jar \
  /absolute/path/to/packetevents-spigot-2.13.0.jar
```

See the six focused and vertical PacketEvents examples under [`runtime/examples/`](runtime/examples/).

## React UI and FastAPI

Graaly’s React package uses real React semantics, including components, JSX, props, state, reducers, Context, effects, Suspense, transitions, and reconciliation. It commits to native game surfaces such as inventories, messages, scoreboards, boss bars, tab lists, and chat input instead of a browser DOM.

For a small native menu without React, `ui.renderHtml` (or Python `ui.render_html`) accepts ordinary semantic HTML and a documented CSS subset. `div` remains a container, `span` remains inline text, `button` remains an action, `input` opens a four-line sign editor, and an open `dialog` becomes an anvil confirmation with its two buttons in slots 0 and 1. CSS grid maps to the 9×1–6 inventory grid; colors map to stained-glass panes (`white` → `WHITE_STAINED_GLASS_PANE`); borders become pane lines; and `border-radius` omits the four corner slots to approximate a rounded panel. See [`runtime/examples/HtmlCssGui.jsplugin`](runtime/examples/HtmlCssGui.jsplugin/) and [`runtime/examples/HtmlCssGui.pyplugin`](runtime/examples/HtmlCssGui.pyplugin/).

This is a server-side compiler into native inventory items, not a browser or pixel renderer. It intentionally supports layout and styling that have a faithful Minecraft representation; arbitrary web CSS, scripts, DOM APIs, and inline `onclick` handlers are rejected. Bind handlers with `data-action` and the `actions` map.

Python can remain the full plugin, or it can own persistence and domain services with FastAPI, Pydantic, SQLAlchemy, WebSockets, dependency injection, migrations, idempotent purchases, and authorization. The server plugin remains the trusted gameplay boundary.

The production-oriented example is [`runtime/examples/ReactFastApi.jsplugin`](runtime/examples/ReactFastApi.jsplugin/).

## Administration and reload behavior

```text
/graaly status
/graaly reload
```

Each bundle owns an isolated language context and its listeners, scheduled work, HTTP work, WebSockets, UI surfaces, and board subscriptions. Reload closes the old ownership scope before enabling the new one, preventing duplicate listeners and late commits from cancelled work.

## Verification

Unit tests, SDK generation, and contract verification:

```bash
cd runtime
mvn clean package
node scripts/generate_api_catalogs.mjs
python3 scripts/verify_contract.py
```

Compile the complete TypeScript SDK:

```bash
../node_modules/.bin/tsc \
  --noEmit \
  --allowImportingTsExtensions \
  --target ES2022 \
  --module NodeNext \
  --moduleResolution NodeNext \
  sdk/typescript/graaly.mts
```

Type-check the strict Python conformance plugin and test the isolated FastAPI service:

```bash
npm run typecheck:python
cd runtime/examples/ReactFastApi.jsplugin/backend
uv run --extra test pytest -q
```

The checked-in `uv.lock` pins the complete Python test/service graph. The CI workflow also builds every JS/TS example and rejects a bundle whose `plugin.yml` names a missing entry file.

Run the real-server matrix against a directory containing versioned server JARs such as `spigot-1.20.6.jar`:

```bash
python3 scripts/test_matrix.py \
  --servers /absolute/path/to/servers \
  --workers 2 \
  --timeout 300
```

The harness copies each server into an isolated temporary directory, installs the built Graaly runtime and JS/Python matrix bundles, validates load/enable/reload, commands, scheduling, constants, entities, attributes, old-version unsupported members, and writes a machine-readable report. Server JARs never enter this repository.

The published results live in [`runtime/reports/compatibility/MATRIX.md`](runtime/reports/compatibility/MATRIX.md) with the matching machine-readable [`matrix.json`](runtime/reports/compatibility/matrix.json).

## Documentation development

```bash
npm install
npm run dev
```

Production verification:

```bash
npm run build
node --test tests/*.test.mjs
npm run lint
npm audit
```

The full 11 MB source catalog is code-split: events and totals are available immediately, while the complete searchable signature dataset loads only when the API reference or global search needs it.

## Security model

Graaly plugins have plugin-level authority over the server. Install only code you trust.

- JavaScript/Python language contexts are isolated per bundle, but that isolation is lifecycle ownership, not a hostile-code sandbox.
- C plugins execute as WebAssembly: their pointers address only guest linear memory, while Minecraft objects cross the boundary as checked handles. A Wasm memory trap is contained to the guest context instead of dereferencing arbitrary JVM memory.
- Live world, player, inventory, and entity state belongs on the main server thread.
- HTTP, database, parsing, and other blocking work belongs off-thread; return through Graaly’s task or coroutine APIs.
- Packet listeners are synchronous and run on the networking thread.
- Secrets belong in environment variables or local configuration excluded from version control.

## Status

The compatibility claim is evidence-backed by the checked-in contract verifier and a real-server matrix spanning every installation available to the project from 1.7.10 through 26.2. The generated docs and SDKs are checked against the same canonical contract so a documented symbol cannot silently disappear from one language or server version.

## License

Graaly is distributed under the [GNU General Public License v3.0](LICENSE). Minecraft server JARs and the optional PacketEvents plugin are not part of this distribution.
