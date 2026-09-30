import { cLabExamples } from "./generated-c-learning";

export const cLearningTrack = {
  title: "C data, bits, layout, and ownership",
  intro: "Build ordinary C data inside Wasm: unsigned masks, bounded bitsets, tagged unions, measured padding, explicit byte formats, and owned allocations. The displayed labs are compiled from the EducationalC example.",
  file: "bitsets.c",
  code: cLabExamples.bitsets,
  recipe: { title: "Padding and a portable byte format", file: "layout-and-wire.c",
    code: cLabExamples.serialization },
  concepts: [
    { syntax: "& · | · ^ · ~ · << · >>", name: "Masks and shifts", detail: "Set, clear, toggle, and extract unsigned flags. Cast bytes before shifting; reject shift counts outside 0..31 for uint32_t." },
    { syntax: "uint64_t words[]", name: "Bitsets", detail: "Store 128 selections in 16 bytes. Divide the index by 64, mask its remainder, and check capacity and bounds before accessing caller-owned storage." },
    { syntax: "enum + union", name: "Tagged unions", detail: "Share storage between alternatives and inspect the tag before reading the active member. Use the resulting value with typed Graaly calls." },
    { syntax: "sizeof · _Alignof · offsetof", name: "Alignment and padding", detail: "Measure internal and trailing padding on wasm32. Reorder fields and check alignment with _Static_assert; packed layout is not a portable network format." },
    { syntax: "uint8_t bytes[]", name: "Explicit serialization", detail: "Encode a 7-byte plugin record field by field in little endian. Bounds checks and byte loads work without aligned pointer casts or uninitialized padding." },
    { syntax: "memcpy", name: "Representations and aliasing", detail: "Inspect floating-point bits with memcpy. A cast does not permit reading an object through an incompatible pointer type." },
    { syntax: "ids[] · malloc · free", name: "Flexible array ownership", detail: "Allocate a header and its variable payload together, check size arithmetic for overflow, and free the one owning pointer exactly once." },
  ],
  sources: [
    { label: "WG14 C11 draft: shifts, unions, alignment, object representation", href: "https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf" },
    { label: "Compiled EducationalC labs", href: "https://github.com/sk8erboi17/Graaly/tree/main/runtime/examples/EducationalC.cplugin" },
  ],
};

export const cLearningExamples = ["shifts", "bitsets", "unions", "padding", "serialization", "aliasing", "flexible-arrays"]
  .map(id => ({ file: `${id}.c`, code: cLabExamples[id] }));
