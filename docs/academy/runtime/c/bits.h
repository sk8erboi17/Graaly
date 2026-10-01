#ifndef GRAALY_BITS_H
#define GRAALY_BITS_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <string.h>

/* Caller-owned storage: no allocation, host handles, or hidden global state. */
typedef struct graaly_bitset {
    uint64_t *words;
    size_t bit_count;
} graaly_bitset_t;

static inline size_t graaly_bitset_word_count(size_t bits) {
    return bits / 64u + (bits % 64u != 0u ? 1u : 0u);
}

static inline bool graaly_bitset_init(
        graaly_bitset_t *out, uint64_t *words, size_t word_capacity, size_t bits) {
    size_t needed = graaly_bitset_word_count(bits);
    if (out == NULL || needed > word_capacity || (needed != 0u && words == NULL)) {
        return false;
    }
    /* Avoid multiplication overflow; initialize exactly the required words. */
    for (size_t index = 0u; index < needed; ++index) words[index] = UINT64_C(0);
    *out = (graaly_bitset_t) { .words = words, .bit_count = bits };
    return true;
}

static inline bool graaly_bitset_put(graaly_bitset_t *set, size_t bit, bool value) {
    if (set == NULL || set->words == NULL || bit >= set->bit_count) return false;
    uint64_t mask = UINT64_C(1) << (bit % 64u);
    if (value) set->words[bit / 64u] |= mask;
    else set->words[bit / 64u] &= ~mask;
    return true;
}

static inline bool graaly_bitset_get(const graaly_bitset_t *set, size_t bit, bool *out) {
    if (set == NULL || set->words == NULL || out == NULL || bit >= set->bit_count) return false;
    *out = (set->words[bit / 64u] & (UINT64_C(1) << (bit % 64u))) != 0u;
    return true;
}

static inline size_t graaly_bitset_count(const graaly_bitset_t *set) {
    if (set == NULL || set->words == NULL) return 0u;
    size_t count = 0u;
    size_t words = graaly_bitset_word_count(set->bit_count);
    for (size_t index = 0u; index < words; ++index) {
        uint64_t value = set->words[index];
        size_t tail = set->bit_count % 64u;
        if (index + 1u == words && tail != 0u) value &= (UINT64_C(1) << tail) - 1u;
        while (value != 0u) {
            value &= value - 1u;
            ++count;
        }
    }
    return count;
}

/* A shift by the width of the operand is invalid C, even inside Wasm. */
static inline bool graaly_u32_shift_left(uint32_t value, unsigned int shift, uint32_t *out) {
    if (out == NULL || shift >= 32u) return false;
    *out = value << shift;
    return true;
}

static inline bool graaly_u32_shift_right(uint32_t value, unsigned int shift, uint32_t *out) {
    if (out == NULL || shift >= 32u) return false;
    *out = value >> shift;
    return true;
}

/* Byte access needs no alignment and defines the wire order explicitly. */
static inline void graaly_u32_store_le(uint8_t bytes[4], uint32_t value) {
    for (unsigned int index = 0u; index < 4u; ++index) {
        bytes[index] = (uint8_t) (value >> (index * 8u));
    }
}

static inline uint32_t graaly_u32_load_le(const uint8_t bytes[4]) {
    return (uint32_t) bytes[0] | ((uint32_t) bytes[1] << 8u)
        | ((uint32_t) bytes[2] << 16u) | ((uint32_t) bytes[3] << 24u);
}

#endif
