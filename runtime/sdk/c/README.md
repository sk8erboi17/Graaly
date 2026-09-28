# Graaly C SDK

Graaly C is intentionally a **C learning surface**, not a Java API translated into C syntax.

The server gives your plugin opaque 64-bit handles for live Minecraft objects. A handle is not a pointer. Your C code decides which fields it wants to copy and how to represent them in its own structs.

## The important rule: you create the structs

Graaly does **not** provide a `Player` struct. Write it yourself:

```c
typedef struct Player {
    graaly_player_handle_t handle;
    char name[32];
    char uuid[37];
    double health;
    int level;
} Player;

static bool player_snapshot(graaly_player_handle_t handle, Player *out) {
    if (out == NULL || handle == 0) {
        return false;
    }

    memset(out, 0, sizeof *out);
    out->handle = handle;
    graaly_player_read_name(handle, out->name, sizeof out->name);
    graaly_player_read_uuid(handle, out->uuid, sizeof out->uuid);
    out->health = graaly_player_health(handle);
    out->level = graaly_player_level(handle);
    return true;
}
```

That exercise teaches real C concepts:

- struct layout and field types;
- fixed-size arrays;
- `sizeof`;
- passing an array as a pointer;
- NUL-terminated strings and capacity;
- value copies versus live host state;
- handles versus pointers;
- object lifetime.

A snapshot is a C value. If the player's Minecraft health changes later, `player.health` does not magically update. Read it again when you need fresh state.

## Build

The reference toolchain is Zig because it ships a WASI sysroot and works consistently on macOS, Linux, and Windows:

```bash
zig cc \
  -target wasm32-wasi \
  -mexec-model=reactor \
  -O2 \
  -Wall -Wextra -Wpedantic -Wshadow -Wconversion \
  -I /path/to/Graaly/runtime/sdk/c/include \
  /path/to/Graaly/runtime/sdk/c/src/graaly.c \
  src/main.c \
  -Wl,--export-memory \
  -o dist/plugin.wasm
```

Clang + a WASI SDK works too. The server itself does not need Zig, Clang, or a C compiler; it only loads the compiled `.wasm`.

## Memory lessons stay real, but contained

Inside WebAssembly linear memory you still use normal C pointers, arrays, `malloc`, `free`, `memcpy`, pointer arithmetic, and function pointers. A bad access that escapes WebAssembly linear memory becomes a guest trap instead of corrupting the JVM.

The SDK includes `GRAALY_DEADBEEF`, explicit poison helpers, and an optional teaching heap with front/back red zones, double-free detection, invalid-pointer detection, logical-free poisoning, and quarantine until plugin disable:

```c
typedef struct MemoryLesson {
    char buffer[16];
    uint32_t canary;
} MemoryLesson;

MemoryLesson lesson = {
    .buffer = {0},
    .canary = GRAALY_DEADBEEF
};
```

For heap lessons, `graaly_debug_malloc` returns a normal guest C pointer. `graaly_debug_check` reports red-zone corruption, while `graaly_debug_free` marks the allocation logically freed and fills its payload with `DEADBEEF`; it intentionally delays the real libc `free` until plugin disable so the learner can inspect the poisoned bytes without dereferencing storage already returned to libc. `graaly_debug_free` called twice returns `GRAALY_MEMORY_ALREADY_FREED`.

Use ordinary `malloc/free` when you want normal C allocator semantics. Use bounded operations in real plugins. Deliberate overflow exercises belong in disposable learning code, because an overflow can still corrupt adjacent data **inside your plugin's WebAssembly memory**.

The `EducationalC.cplugin` example includes three focused memory labs: `/cheap` shows logical free, `DEADBEEF` poisoning, and double-free detection; `/coverflow` corrupts exactly one byte of a private red zone and reports `buffer-overflow`; `/csegfault` is operator-only and intentionally writes outside current WebAssembly linear memory. The last command traps the guest, Graaly quarantines that C instance, and `/graaly reload` replaces it with a fresh instance.

## Current C ABI v1

C ABI v1 now covers the full Graaly contract while keeping C low-level and educational.

### Canonical API parity

`include/graaly/catalog.h` is generated from the exact same canonical contract used by the TypeScript and Python SDKs. The checked-in manifest currently verifies:

- **1,421 exported Graaly types**;
- **1,411 canonical Java API classes** behind those exports;
- **63,044 canonical member references**;
- **9,704 unique member/property/method names**;
- **4,629 canonical constants** across 13 namespaces;
- PacketEvents symbols generated alongside the main catalog: **289 wrappers**, **533 supporting types**, **288 packet type paths**, and **2,926 wrapper/support member names**;
- every public Graaly module: events, commands, tasks, config, players, worlds, entities, HTTP, WebSocket, UI, boards, PacketEvents, compatibility, and diagnostics.

The catalog uses stable names rather than Java class paths:

```c
graaly_value_t player_type;
graaly_type(GRAALY_TYPE_PLAYER, &player_type);

graaly_value_t stone;
graaly_constant(
    GRAALY_NAMESPACE_MATERIAL,
    GRAALY_MATERIAL_STONE,
    &stone
);
```

Every canonical object can be inspected and operated through the universal bridge:

```c
graaly_value_t health;
graaly_get(player.handle, GRAALY_MEMBER_HEALTH, &health);

graaly_set(
    player.handle,
    GRAALY_MEMBER_ALLOWFLIGHT,
    graaly_value_bool(true)
);

graaly_value_t location;
graaly_get(player.handle, GRAALY_MEMBER_LOCATION, &location);

graaly_value_t permission_args[] = {
    graaly_value_string("example.use")
};
graaly_value_t allowed;
graaly_call(
    player.handle,
    GRAALY_MEMBER_HASPERMISSION,
    permission_args,
    1,
    &allowed
);
```

`graaly_construct`, `graaly_static_member`, collection helpers, map helpers, optional helpers, and explicit handle release complete the canonical object surface. Older Minecraft versions go through Graaly's existing compatibility adapter; a real canonical member that the running version cannot implement remains an explicit unsupported feature rather than silently succeeding.

### Native C module facades

High-level Graaly modules also have normal C entrypoints, for example:

```c
graaly_players_online(&players);
graaly_worlds_location(world, 0.5, 65.0, 0.5, 0.0, 0.0, &spawn);
graaly_http_get(url, "{}", 15000, on_http, &request);
graaly_ui_render(player, snapshot_json, on_ui_action);
graaly_packets_on_receive(packet_type, "NORMAL", on_packet, &binding);
```

Callbacks are real C function pointers stored inside the WebAssembly module. Java receives only callback IDs. The universal callback registry carries callback arguments as `graaly_value_t[]`, so asynchronous HTTP, WebSocket, UI, board, PacketEvents, world-generator, and scheduler callbacks do not expose Graal `Value` or Java class paths to plugin code.

### Deliberately still C

Full API parity does **not** mean generated Java-shaped structs. Graaly still refuses to define a `Player` struct for you. You decide the struct layout, arrays, pointer ownership, copied snapshots, and lifetimes. Handles are the host boundary; your own data model is ordinary C.

The ABI additionally includes:

- load / enable / disable lifecycle;
- commands with `argc`, string views, and tab completion;
- all Bukkit event types through generated canonical event names and C function pointers;
- main-thread and async scheduling;
- per-callback host handles with stale/forged-handle rejection;
- explicit pointer + length validation at every host boundary;
- optional DEADBEEF teaching heap with red zones, logical free, poisoning, and double-free/invalid-pointer diagnostics;
- hot reload by replacing the WebAssembly instance after cleanup or a contained guest trap.

The generator is `runtime/scripts/generate_c_sdk.py`. Changes to the canonical catalogs must regenerate `catalog.h` and `catalog-manifest.json`; the contract verifier rejects stale counts or a missing C module surface.
