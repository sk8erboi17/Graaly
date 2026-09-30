#include <graaly/graaly.h>

#include <stdio.h>
#include <string.h>
#include "c-labs.h"

/*
 * Graaly intentionally does not provide this struct.
 *
 * The plugin author decides what a Player means in C, how much memory fields
 * use, and whether this is a live view or (as here) a copied snapshot.
 */
typedef struct Player {
    graaly_player_t host;
    char name[32];
    char uuid[37];
    double health;
    int level;
} Player;

typedef struct MemoryLesson {
    char buffer[16];
    uint32_t canary;
} MemoryLesson;

static bool player_snapshot(graaly_player_t player, Player *out) {
    if (out == NULL || player._handle == 0u) {
        return false;
    }

    memset(out, 0, sizeof *out);
    out->host = player;

    size_t required = 0u;
    if (graaly_player_name(player, out->name, sizeof out->name, &required) != GRAALY_OK) {
        return false;
    }

    graaly_object_t uuid = {0};
    if (graaly_player_unique_id(player, &uuid) != GRAALY_OK) {
        return false;
    }
    graaly_object_text(uuid, out->uuid, sizeof out->uuid, &required);
    graaly_object_release(&uuid);

    double level = 0.0;
    if (graaly_player_health(player, &out->health) != GRAALY_OK
            || graaly_player_level(player, &level) != GRAALY_OK) {
        return false;
    }
    out->level = (int) level;
    return true;
}

static void on_join(graaly_player_t handle) {
    Player player;
    if (!player_snapshot(handle, &player)) {
        return;
    }

    char message[160];
    int written = snprintf(
            message,
            sizeof message,
            "&a[C] Welcome %s &7| HP %.1f | level %d",
            player.name,
            player.health,
            player.level);

    if (written > 0) {
        graaly_player_message(handle, message);
    }
}

static bool cplayer_command(
        graaly_sender_t sender,
        int argc,
        const graaly_string_view_t *argv) {
    graaly_player_t player_handle = {0};
    if (graaly_sender_player(sender, &player_handle) != GRAALY_OK) {
        graaly_sender_message(sender, "&cThis command needs a player.");
        return true;
    }

    Player player;
    if (!player_snapshot(player_handle, &player)) {
        graaly_sender_message(sender, "&cCould not build Player snapshot.");
        return true;
    }

    char note[48] = "no note";
    if (argc > 0) {
        /*
         * argv[0] is pointer+length, not magically a C string.
         * We explicitly bound the copy and add the NUL terminator ourselves.
         */
        size_t copy = argv[0].length;
        if (copy >= sizeof note) {
            copy = sizeof note - 1;
        }
        memcpy(note, argv[0].data, copy);
        note[copy] = '\0';
    }

    char message[220];
    snprintf(
            message,
            sizeof message,
            "&bPlayer struct: name=%s hp=%.1f lvl=%d uuid=%s note=%s",
            player.name,
            player.health,
            player.level,
            player.uuid,
            note);
    graaly_sender_message(sender, message);
    return true;
}

static bool ccatalog_command(
        graaly_sender_t sender,
        int argc,
        const graaly_string_view_t *argv) {
    (void) argc;
    (void) argv;

    graaly_player_t player = {0};
    if (graaly_sender_player(sender, &player) != GRAALY_OK) {
        graaly_sender_message(sender, "&cThis command needs a player.");
        return true;
    }

    char name[32] = {0};
    size_t required = 0u;
    double health = 0.0;
    graaly_status_t name_status =
            graaly_player_name(player, name, sizeof name, &required);
    graaly_status_t health_status =
            graaly_player_health(player, &health);

    char message[220];
    snprintf(
            message,
            sizeof message,
            "&aTyped C API: player=%s health=%.1f status=%s",
            name_status == GRAALY_OK ? name : "<error>",
            health,
            health_status == GRAALY_OK ? "ok" : "FAIL");
    graaly_sender_message(sender, message);
    return true;
}

static bool cmemory_command(
        graaly_sender_t sender,
        int argc,
        const graaly_string_view_t *argv) {
    (void) argc;
    (void) argv;

    MemoryLesson lesson = {
            .buffer = {0},
            .canary = GRAALY_DEADBEEF
    };

    /*
     * Fill only the array, not the canary. The fields are adjacent in the
     * struct, which makes their layout visible without deliberately invoking
     * undefined behaviour in the production example.
     */
    graaly_debug_poison(lesson.buffer, sizeof lesson.buffer, UINT32_C(0xA5A5A5A5));

    char message[180];
    snprintf(
            message,
            sizeof message,
            "&eMemoryLesson @ %p | buffer=%zu bytes | canary=0x%08X | intact=%s",
            (void *) &lesson,
            sizeof lesson.buffer,
            (unsigned int) lesson.canary,
            graaly_debug_canary_is_deadbeef(lesson.canary) ? "yes" : "NO");

    graaly_sender_message(sender, message);
    return true;
}

static bool cheap_command(
        graaly_sender_t sender,
        int argc,
        const graaly_string_view_t *argv) {
    (void) argc;
    (void) argv;

    /*
     * This is an educational heap, not a replacement for malloc/free.
     * The returned pointer is a normal C pointer into WebAssembly memory.
     */
    uint32_t *value = (uint32_t *) graaly_debug_malloc(sizeof *value);
    if (value == NULL) {
        graaly_sender_message(sender, "&cTeaching heap allocation failed.");
        return true;
    }

    *value = UINT32_C(0x12345678);
    graaly_memory_status_t before = graaly_debug_check(value);
    size_t bytes = graaly_debug_allocation_size(value);

    /*
     * debug_free performs a logical free and quarantines the storage. The SDK
     * poisons the payload with DEADBEEF so we can inspect stale-memory state
     * without using libc memory that has actually been returned by free().
     */
    graaly_memory_status_t free_status = graaly_debug_free(value);
    graaly_memory_status_t after = graaly_debug_check(value);
    uint32_t poisoned = *value;
    graaly_memory_status_t second_free = graaly_debug_free(value);

    char message[280];
    snprintf(
            message,
            sizeof message,
            "&6Teaching heap ptr=%p size=%zu | before=%s | free=%s | after=%s | double-free=%s | poison=0x%08X",
            (void *) value,
            bytes,
            graaly_memory_status_name(before),
            graaly_memory_status_name(free_status),
            graaly_memory_status_name(after),
            graaly_memory_status_name(second_free),
            (unsigned int) poisoned);
    graaly_sender_message(sender, message);
    return true;
}

static bool coverflow_command(
        graaly_sender_t sender,
        int argc,
        const graaly_string_view_t *argv) {
    (void) argc;
    (void) argv;

    unsigned char *buffer = (unsigned char *) graaly_debug_malloc(8u);
    if (buffer == NULL) {
        graaly_sender_message(sender, "&cTeaching heap allocation failed.");
        return true;
    }

    for (size_t index = 0; index < 8u; index++) {
        buffer[index] = (unsigned char) ('A' + (int) index);
    }

    /*
     * The teaching allocator owns extra storage after the 8-byte logical
     * buffer. Writing byte 8 corrupts its first red-zone byte while remaining
     * inside the allocator's real malloc block. This makes the overflow
     * observable and repeatable without writing outside WebAssembly memory.
     */
    buffer[8] = (unsigned char) 'X';

    graaly_memory_status_t detected = graaly_debug_check(buffer);
    graaly_memory_status_t freed = graaly_debug_free(buffer);

    char message[180];
    snprintf(
            message,
            sizeof message,
            "&cOverflow lab: check=%s | free observed=%s",
            graaly_memory_status_name(detected),
            graaly_memory_status_name(freed));
    graaly_sender_message(sender, message);
    return true;
}

static bool csegfault_command(
        graaly_sender_t sender,
        int argc,
        const graaly_string_view_t *argv) {
    (void) argc;
    (void) argv;

    graaly_sender_message(
            sender,
            "&cIntentional C memory fault: this guest will trap. Use /graaly reload afterwards.");

    /*
     * This address is outside the plugin's current WebAssembly linear memory.
     * GraalWasm turns the store into a guest trap; it is not a native pointer
     * into the JVM process.
     */
    volatile uint32_t *bad =
            (volatile uint32_t *) (uintptr_t) UINT32_C(0xFFFFFFFC);
    *bad = GRAALY_DEADBEEF;
    return true;
}

static bool cbits_command(graaly_sender_t sender, int argc, const graaly_string_view_t *argv) {
    (void) argc;
    (void) argv;
    uint32_t shifted = 0u;
    bool rejected = !graaly_u32_shift_left(1u, 32u, &shifted);
    graaly_u32_shift_left(1u, 31u, &shifted);
    char message[240];
    snprintf(message, sizeof message,
             "&aC bits: mask=0x%02X | selected=%zu/128 | rgb=0x%06X | bit31=0x%08X | shift32 rejected=%s",
             (unsigned int) lab_flags(), lab_bitset(), (unsigned int) lab_rgb(0x12u, 0x34u, 0x56u),
             (unsigned int) shifted, rejected ? "yes" : "NO");
    graaly_sender_message(sender, message);
    return true;
}

static bool cunion_command(graaly_sender_t sender, int argc, const graaly_string_view_t *argv) {
    (void) argc;
    (void) argv;
    LabPlayerUpdate update = { .kind = LAB_HEALTH, .value.health = 20.0 };
    double health = 0.0;
    bool read_health = lab_update_health(&update, &health);
    update = (LabPlayerUpdate) { .kind = LAB_FLAGS, .value.flags = lab_flags() };
    bool inactive_rejected = !lab_update_health(&update, &health);
    char message[200];
    snprintf(message, sizeof message,
             "&bC tagged union: health=%.1f read=%s | flags=0x%02X | inactive health rejected=%s | size=%zu",
             health, read_health ? "yes" : "NO", (unsigned int) update.value.flags,
             inactive_rejected ? "yes" : "NO", sizeof update);
    graaly_sender_message(sender, message);
    return true;
}

static bool clayout_command(graaly_sender_t sender, int argc, const graaly_string_view_t *argv) {
    (void) argc;
    (void) argv;
    LabCompact record = { .score = UINT32_C(0x12345678), .level = 42u, .flags = 5u };
    uint8_t wire[LAB_WIRE_SIZE];
    LabCompact decoded = {0};
    bool roundtrip = lab_encode(wire, sizeof wire, &record) && lab_decode(wire, sizeof wire, &decoded)
        && decoded.score == record.score && decoded.level == record.level && decoded.flags == record.flags;
    LabBatch *batch = lab_batch_new(3u);
    char message[300];
    snprintf(message, sizeof message,
             "&eC layout: padded=%zu compact=%zu align=%zu score@%zu level@%zu flags@%zu tail=%zu | wire=%zu bytes roundtrip=%s | batch=%zu",
             sizeof(LabPadded), sizeof(LabCompact), _Alignof(LabCompact), offsetof(LabCompact, score),
             offsetof(LabCompact, level), offsetof(LabCompact, flags), lab_tail_padding(), sizeof wire,
             roundtrip ? "ok" : "FAIL", batch != NULL ? batch->count : 0u);
    free(batch);
    graaly_sender_message(sender, message);
    return true;
}

void graaly_on_load(void) {
    graaly_log(GRAALY_LOG_INFO, "EducationalC loaded: structs are owned by C plugin code.");
}

void graaly_on_enable(void) {
    graaly_events_on(GRAALY_EVENT_PLAYER_JOIN, on_join);
    graaly_commands_on("cplayer", cplayer_command);
    graaly_commands_on("ccatalog", ccatalog_command);
    graaly_commands_on("cmemory", cmemory_command);
    graaly_commands_on("cbits", cbits_command);
    graaly_commands_on("cunion", cunion_command);
    graaly_commands_on("clayout", clayout_command);
    graaly_commands_on("cheap", cheap_command);
    graaly_commands_on("coverflow", coverflow_command);
    graaly_commands_on("csegfault", csegfault_command);
    graaly_log(GRAALY_LOG_INFO, "EducationalC enabled.");
}

void graaly_on_disable(void) {
    graaly_log(GRAALY_LOG_INFO, "EducationalC disabled.");
}
