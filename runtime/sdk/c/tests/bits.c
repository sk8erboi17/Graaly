#include "../../../examples/EducationalC.cplugin/src/c-labs.h"
#include <assert.h>
#include <stdio.h>

int main(void) {
    uint64_t storage[3] = { UINT64_MAX, UINT64_MAX, UINT64_C(0xCAFE) };
    graaly_bitset_t bits = {0};
    assert(!graaly_bitset_init(NULL, storage, 2u, 65u));
    assert(!graaly_bitset_init(&bits, NULL, 2u, 65u));
    assert(!graaly_bitset_init(&bits, storage, 1u, 65u));
    assert(graaly_bitset_init(&bits, storage, 2u, 65u));
    assert(storage[0] == 0u && storage[1] == 0u && storage[2] == UINT64_C(0xCAFE));
    for (size_t bit = 0u; bit < 65u; ++bit) assert(graaly_bitset_put(&bits, bit, true));
    assert(graaly_bitset_count(&bits) == 65u);
    assert(!graaly_bitset_put(&bits, 65u, true));
    assert(graaly_bitset_put(&bits, 63u, false));
    bool value = true;
    assert(graaly_bitset_get(&bits, 63u, &value) && !value);
    assert(!graaly_bitset_get(&bits, 65u, &value));
    assert(!graaly_bitset_get(&bits, 1u, NULL));
    storage[1] = UINT64_MAX; /* unused tail bits do not contribute */
    assert(graaly_bitset_count(&bits) == 64u);
    assert(graaly_bitset_word_count(SIZE_MAX) == SIZE_MAX / 64u + 1u);
    assert(graaly_bitset_init(&bits, NULL, 0u, 0u));
    assert(graaly_bitset_count(&bits) == 0u);

    uint32_t shifted = 7u;
    assert(graaly_u32_shift_left(1u, 31u, &shifted) && shifted == UINT32_C(0x80000000));
    assert(graaly_u32_shift_right(shifted, 31u, &shifted) && shifted == 1u);
    assert(!graaly_u32_shift_left(1u, 32u, &shifted) && shifted == 1u);
    assert(!graaly_u32_shift_right(1u, UINT32_MAX, &shifted));
    assert(!graaly_u32_shift_left(1u, 0u, NULL));
    assert(lab_flags() == LAB_DIRTY);
    assert(lab_rgb(0x12u, 0x34u, 0x56u) == UINT32_C(0x123456));
    assert(lab_bitset() == 2u);

    LabPlayerUpdate update = { .kind = LAB_HEALTH, .value.health = 20.0 };
    double health = 0.0;
    assert(lab_update_health(&update, &health) && health == 20.0);
    update = (LabPlayerUpdate) { .kind = LAB_FLAGS, .value.flags = LAB_DIRTY };
    assert(!lab_update_health(&update, &health));
    update.kind = (LabUpdateKind) 99;
    assert(!lab_update_health(&update, &health));

    LabCompact record = { .score = UINT32_C(0x12345678), .level = UINT16_C(0xABCD), .flags = 5u };
    uint8_t wire[8] = {0};
    const uint8_t expected[] = {5u, 0x78u, 0x56u, 0x34u, 0x12u, 0xCDu, 0xABu};
    assert(lab_encode(wire + 1u, 7u, &record)); /* deliberately unaligned */
    assert(memcmp(wire + 1u, expected, sizeof expected) == 0);
    assert(!lab_encode(wire, 6u, &record));
    LabCompact decoded = {0};
    assert(lab_decode(expected, sizeof expected, &decoded));
    assert(decoded.flags == record.flags && decoded.score == record.score && decoded.level == record.level);
    assert(!lab_decode(expected, 6u, &decoded));
    assert(lab_double_bits(1.0) == UINT64_C(0x3FF0000000000000));

    assert(lab_batch_new(SIZE_MAX) == NULL);
    LabBatch *batch = lab_batch_new(3u);
    assert(batch != NULL && batch->count == 3u && batch->ids[2] == 2u);
    free(batch);
    batch = lab_batch_new(0u);
    assert(batch != NULL && batch->count == 0u);
    free(batch);
    printf("C labs passed; padded=%zu compact=%zu alignment=%zu tail=%zu\n",
           sizeof(LabPadded), sizeof(LabCompact), _Alignof(LabCompact), lab_tail_padding());
    return 0;
}
