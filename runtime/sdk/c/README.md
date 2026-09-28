# Graaly C SDK

Graaly C is intentionally a **C learning surface**, not a Java API translated into C syntax.

The server gives your plugin opaque 64-bit handles for live Minecraft objects. A handle is not a pointer. Your C code decides which fields it wants to copy and how to represent them in its own structs.

## The important rule: you create the structs

Graaly does **not** provide a `Player` struct. Write it yourself:

```c
typedef struct Player {
    graaly_player_t host;
    char name[32];
    char uuid[37];
    double health;
    int level;
} Player;

static bool player_snapshot(graaly_player_t player, Player *out) {
    if (out == NULL || !graaly_is_valid(player)) {
        return false;
    }

    memset(out, 0, sizeof *out);
    out->host = player;

    size_t required = 0;
    double level = 0.0;
    graaly_object_t uuid = {0};

    if (graaly_player_name(player, out->name, sizeof out->name, &required) != GRAALY_OK
            || graaly_player_unique_id(player, &uuid) != GRAALY_OK
            || graaly_object_text(uuid, out->uuid, sizeof out->uuid, &required) != GRAALY_OK
            || graaly_player_health(player, &out->health) != GRAALY_OK
            || graaly_player_level(player, &level) != GRAALY_OK) {
        graaly_release(&uuid);
        return false;
    }

    graaly_release(&uuid);
    out->level = (int) level;
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

The public SDK is generated as ordinary C functions over opaque typed handles. Normal plugin code does not use reflection-style member names:

```c
graaly_player_t player = {0};
if (graaly_player_find_exact("Steve", &player) != GRAALY_OK) {
    return;
}

char name[32];
size_t required = 0;
double health = 0.0;
bool allowed = false;

graaly_player_name(player, name, sizeof name, &required);
graaly_player_health(player, &health);
graaly_player_has_permission(player, "example.use", &allowed);

if (health < 10.0) {
    graaly_player_health_write(player, 20.0);
}

graaly_location_t location = {0};
graaly_player_location(player, &location);

/* Explicit ownership: returned host handles are released by the caller. */
graaly_release(&location);
graaly_release(&player);
```

The generated typed facade currently contains **26,069 typed property readers**, **11,096 typed property writes**, and **17,875 typed method wrappers**. C overloads are disambiguated by arity or argument type only when necessary. Natural overloads get the short name, for example `graaly_player_has_permission(...)`.

The reflection bridge (`graaly_get`, `graaly_set`, `graaly_call`) is no longer part of the normal public surface. It is available only to low-level tooling that explicitly defines `GRAALY_ENABLE_RAW_ABI` before including the SDK. Older Minecraft versions still go through Graaly's existing compatibility adapter; unsupported mechanics fail explicitly rather than pretending to work.

### Native C module facades

High-level Graaly modules also have normal C entrypoints, for example:

```c
graaly_player_t players[64];
size_t player_count = 0;
graaly_player_list(players, 64, &player_count);

graaly_world_t world = {0};
graaly_world_find("world", &world);

graaly_location_t spawn = {0};
graaly_location_make(world, 0.5, 65.0, 0.5, 0.0, 0.0, &spawn);

graaly_entity_type_t zombie = {0};
graaly_entity_t mob = {0};
graaly_entity_type_find("ZOMBIE", &zombie);
graaly_entity_spawn_at(spawn, zombie, &mob);

graaly_http_get(url, "{}", 15000, on_http, &request);
graaly_ui_render(player_handle, snapshot_json, on_ui_action);
```

Callbacks are real C function pointers stored inside the WebAssembly module. Java receives only callback IDs. Text/JSON transports such as HTTP, WebSocket, UI actions, and boards use `graaly_text_callback_t(const char *text, size_t length)` so normal C code receives ordinary pointer+length data. Events, commands, tasks, and PacketEvents have dedicated typed callback signatures. A private carrier-array callback path remains only inside the implementation for advanced cases that cannot yet be expressed losslessly by the typed facade.

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

The catalog generator is `runtime/scripts/generate_c_sdk.py`; the typed facade generator is `runtime/scripts/generate_c_typed_api.mjs`. Changes to the canonical API must regenerate `catalog.h`, `types.h`, `typed.h`, and their manifests. CI rejects stale generated C files or a return to reflection-style examples.
