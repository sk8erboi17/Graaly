#ifndef GRAALY_C_LABS_H
#define GRAALY_C_LABS_H

#include <graaly/bits.h>
#include <stdlib.h>

/* docs:shifts:start */
/* Unsigned masks describe plugin-owned state, not Java object layout. */
enum { LAB_VISIBLE = 1u << 0u, LAB_SELECTED = 1u << 1u, LAB_DIRTY = 1u << 2u };

static inline uint32_t lab_flags(void) {
    uint32_t flags = LAB_VISIBLE | LAB_SELECTED;
    flags |= LAB_DIRTY;              /* set */
    flags &= ~((uint32_t) LAB_SELECTED); /* clear */
    flags ^= LAB_VISIBLE;            /* toggle */
    return flags;
}

static inline uint32_t lab_rgb(uint8_t red, uint8_t green, uint8_t blue) {
    return ((uint32_t) red << 16u) | ((uint32_t) green << 8u) | (uint32_t) blue;
}
/* graaly_u32_shift_left(1u, 31u, &out) succeeds; shift 32 is rejected. */
/* docs:shifts:end */

/* docs:bitsets:start */
static inline size_t lab_bitset(void) {
    uint64_t storage[2];             /* 128 flags, 16 bytes */
    graaly_bitset_t selected = {0};
    if (!graaly_bitset_init(&selected, storage, 2u, 128u)) return 0u;
    graaly_bitset_put(&selected, 1u, true);
    graaly_bitset_put(&selected, 65u, true);  /* crosses the word boundary */
    graaly_bitset_put(&selected, 127u, true);
    graaly_bitset_put(&selected, 65u, false);
    bool last = false;
    graaly_bitset_get(&selected, 127u, &last);
    /* Index 128 is rejected. Storage must outlive selected. */
    return last ? graaly_bitset_count(&selected) : 0u; /* 2 */
}
/* docs:bitsets:end */

/* docs:unions:start */
typedef enum LabUpdateKind { LAB_HEALTH, LAB_FLAGS } LabUpdateKind;
typedef struct LabPlayerUpdate {
    LabUpdateKind kind;
    union { double health; uint32_t flags; } value;
} LabPlayerUpdate;

static inline bool lab_update_health(const LabPlayerUpdate *update, double *out) {
    if (update == NULL || out == NULL) return false;
    switch (update->kind) {
        case LAB_HEALTH: *out = update->value.health; return true;
        case LAB_FLAGS: return false; /* the health member is not active */
    }
    return false;
}
/* LabPlayerUpdate update = { .kind = LAB_HEALTH, .value.health = 20.0 }; */
/* Validate the tag before calling graaly_player_health_write(player, health). */
/* docs:unions:end */

/* docs:padding:start */
typedef struct LabPadded { uint8_t flags; uint32_t score; uint16_t level; } LabPadded;
typedef struct LabCompact { uint32_t score; uint16_t level; uint8_t flags; } LabCompact;

_Static_assert(offsetof(LabCompact, score) == 0u, "first field starts at zero");
_Static_assert(offsetof(LabCompact, level) % _Alignof(uint16_t) == 0u, "aligned level");
_Static_assert(sizeof(LabCompact) % _Alignof(LabCompact) == 0u, "aligned array stride");

static inline size_t lab_tail_padding(void) {
    return sizeof(LabCompact) - (offsetof(LabCompact, flags) + sizeof(uint8_t));
}
/* Print sizeof, _Alignof and offsetof on the target. Do not assume host sizes. */
/* Reordering fields can reduce padding; packed fields may be misaligned. */
/* docs:padding:end */

/* docs:serialization:start */
enum { LAB_WIRE_SIZE = 7 };
static inline bool lab_encode(uint8_t *bytes, size_t capacity, const LabCompact *record) {
    if (bytes == NULL || record == NULL || capacity < LAB_WIRE_SIZE) return false;
    bytes[0] = record->flags;
    graaly_u32_store_le(bytes + 1u, record->score);
    bytes[5] = (uint8_t) record->level;
    bytes[6] = (uint8_t) ((uint32_t) record->level >> 8u);
    return true;
}

static inline bool lab_decode(const uint8_t *bytes, size_t length, LabCompact *out) {
    if (bytes == NULL || out == NULL || length < LAB_WIRE_SIZE) return false;
    *out = (LabCompact) {
        .score = graaly_u32_load_le(bytes + 1u),
        .level = (uint16_t) ((uint32_t) bytes[5] | ((uint32_t) bytes[6] << 8u)),
        .flags = bytes[0]
    };
    return true;
}
/* A defined 7-byte record: no padding, unaligned casts, or native-endian integers. */
/* Never send sizeof(struct) bytes or compare structs with memcmp. */
/* This is a plugin-owned format; PacketEvents still encodes Minecraft packets. */
/* docs:serialization:end */

/* docs:aliasing:start */
static inline uint64_t lab_double_bits(double value) {
    _Static_assert(sizeof(double) == sizeof(uint64_t), "64-bit double target required");
    uint64_t bits = 0u;
    memcpy(&bits, &value, sizeof bits);
    return bits;
}
/* memcpy copies the representation. *(uint64_t *)&value violates aliasing rules. */
/* A tagged union models alternatives; it is not a portable wire serializer. */
/* docs:aliasing:end */

/* docs:flexible-arrays:start */
typedef struct LabBatch { size_t count; uint32_t ids[]; } LabBatch;

static inline LabBatch *lab_batch_new(size_t count) {
    if (count > (SIZE_MAX - sizeof(LabBatch)) / sizeof(uint32_t)) return NULL;
    LabBatch *batch = malloc(sizeof *batch + count * sizeof batch->ids[0]);
    if (batch == NULL) return NULL;
    batch->count = count;
    for (size_t index = 0u; index < count; ++index) batch->ids[index] = (uint32_t) index;
    return batch;
}
/* LabBatch *batch = lab_batch_new(3u); ... free(batch); */
/* One allocation owns the header and payload. No use of batch after free. */
/* docs:flexible-arrays:end */

#endif
