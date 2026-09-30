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

## Bits, unions, alignment, and byte formats

`<graaly/bits.h>` supplies small C helpers over **caller-owned memory**. It does not allocate storage, retain host handles, or add a plugin framework. A bounded bitset can track selected slots, visited chunks, or local flags:

```c
#include <graaly/bits.h>

uint64_t storage[2];
graaly_bitset_t visited = {0};
if (!graaly_bitset_init(&visited, storage, 2u, 128u)) return;
graaly_bitset_put(&visited, 63u, true);
graaly_bitset_put(&visited, 64u, true);
graaly_bitset_put(&visited, 127u, true);
graaly_bitset_put(&visited, 64u, false);
bool selected = false;
graaly_bitset_get(&visited, 127u, &selected);
size_t count = graaly_bitset_count(&visited); /* 2 */
```

The storage must outlive the bitset. Initialization checks the required word capacity, and get/put reject indexes at or beyond `bit_count`. Counting masks unused tail bits. A `uint64_t` word uses `UINT64_C(1) << (index % 64)`, with `index / 64` selecting the word. C bit-fields have implementation-dependent layout and are unsuitable as portable wire records.

Use unsigned operands for masks and shifts. `graaly_u32_shift_left` and `graaly_u32_shift_right` reject counts of 32 or more before evaluating the shift and leave the output unchanged on failure. For example, shifting `UINT32_C(1)` by 31 produces `0x80000000`; shifting it by 32 is invalid C. Wasm containment does not change C's rules about signed overflow, aliasing, or invalid shifts.

For alternative payloads, define a **tagged union** yourself:

```c
typedef enum UpdateKind { UPDATE_HEALTH, UPDATE_FLAGS } UpdateKind;
typedef struct Update {
    UpdateKind kind;
    union { double health; uint32_t flags; } value;
} Update;

Update update = { .kind = UPDATE_HEALTH, .value.health = 20.0 };
if (update.kind == UPDATE_HEALTH) {
    graaly_player_health_write(player, update.value.health);
}
```

Check the tag before reading the selected member. A union shares storage; its size also depends on alignment. To inspect floating-point representation, copy it with `memcpy` into a same-sized integer. Do not read it through an incompatible cast pointer.

Measure layout with `sizeof`, `_Alignof`, and `offsetof`. The compiler can insert padding between fields and at the end of a struct so arrays remain aligned. Reordering fields can reduce padding, but layout is a target property, not a serialization contract. The labs compare `{ uint8_t flags; uint32_t score; uint16_t level; }` with the reordered form, report every offset, and check alignment with `_Static_assert`.

`graaly_u32_store_le` and `graaly_u32_load_le` encode integers byte by byte without aligned pointer casts. The example combines them into a **7-byte** flags/score/level record with capacity checks and explicit little-endian order. This is a plugin-owned format: PacketEvents continues to encode Minecraft's protocol. Do not serialize struct padding, compare structs with `memcmp`, or assume `packed` attributes define a portable format.

The compiled [EducationalC labs](../../examples/EducationalC.cplugin/src/c-labs.h) also demonstrate a flexible array member: validate `sizeof(header) + count * sizeof(element)` before allocating, let one pointer own the header and payload, and free it once. Run `/cbits`, `/cunion`, and `/clayout` to inspect the actual wasm32 results. `test-compile.sh` compiles the labs for WASI and runs their boundary and byte-format tests with AddressSanitizer and UndefinedBehaviorSanitizer on the host. The rules follow the [WG14 C11 draft](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf), especially sections 6.5.7, 6.7.2.1, 6.2.6, and 6.2.8.

## PacketEvents in C

Include `<graaly/packets.h>`. `graaly_packet_available(&available)` detects the optional integration; when available, `graaly_packet_version(buffer, capacity, &required)` reads its version. Register synchronous receive/send listeners with a `graaly_packet_type_t`, use a matching `graaly_pe_wrapper_*__from_event`, and release the returned owned wrapper. Properties have typed reads and `_write` functions; call `graaly_packet_event_reencode` after rewriting a wrapper, or `graaly_packet_event_cancelled_write(event, true)` to block it.

The runnable [PacketEventsC example](../../examples/PacketEventsC.cplugin/) normalizes chat, cancels `stop`, observes outgoing health, creates an UpdateHealth packet, and reports protocol version and ping. Its bounded task queue copies names/text before returning from the network callback, then re-resolves the player on the server thread. It does not retain borrowed callback handles. Graaly serializes invocation of each Wasm instance and unregisters its listeners on disable/reload. Build with `./build.sh`; install PacketEvents separately; run `/cpackethealth` and `/cpacketinfo`. The health packet changes the client's display without changing server health.

The website's API and PacketEvents catalogs have a C tab with exact declarations from the shipped headers, including inherited instance methods, property writes, constructors where supported, and overload suffixes. C reference data loads only when selected. Some complex Java callback/generic overloads do not yet have a typed C adapter; the catalog lists the available functions explicitly rather than inventing bindings.

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
