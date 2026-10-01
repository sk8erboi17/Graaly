// Generated from the authored language courses by scripts/generate-academy-lessons.mjs.
import type { GameLesson } from "./lessons.ts";

export const foundationCheckpoints: readonly GameLesson[] = [
  {
    "number": 37,
    "track": "JavaScript",
    "title": "Values, references, and ownership at a plugin boundary",
    "concept": "A reference gives access to an object; it does not grant permission to change that object.",
    "question": "Does object spread clone nested arrays?",
    "accepted": [
      "no"
    ]
  },
  {
    "number": 38,
    "track": "JavaScript",
    "title": "Build a scanner with explicit quoting states",
    "concept": "A scanner consumes each character once while carrying the state needed to interpret it.",
    "question": "What represents the scanner's quoting rules?",
    "accepted": [
      "state machine",
      "a state machine"
    ]
  },
  {
    "number": 39,
    "track": "JavaScript",
    "title": "Closures, subscriptions, and plugin teardown",
    "concept": "A closure retains the variables it needs for as long as the callback remains reachable.",
    "question": "What undoes a subscription?",
    "accepted": [
      "disposer",
      "dispose",
      "cleanup"
    ]
  },
  {
    "number": 40,
    "track": "JavaScript",
    "title": "Promises, stale responses, and cancellation",
    "concept": "Completion order belongs to the network; publication order belongs to your application.",
    "question": "What prevents an obsolete response from publishing?",
    "accepted": [
      "generation guard",
      "generation token",
      "generation"
    ]
  },
  {
    "number": 41,
    "track": "JavaScript",
    "title": "Maps, deterministic order, and bounded event windows",
    "concept": "A cache needs an eviction rule as well as a lookup rule.",
    "question": "Which operation refreshes a Map key's insertion position?",
    "accepted": [
      "delete then set",
      "delete and set"
    ]
  },
  {
    "number": 42,
    "track": "TypeScript",
    "title": "unknown, narrowing, and runtime validation",
    "concept": "A type annotation describes trusted values; it does not validate untrusted bytes.",
    "question": "Does a TypeScript assertion validate JSON at runtime?",
    "accepted": [
      "no"
    ]
  },
  {
    "number": 43,
    "track": "TypeScript",
    "title": "Discriminated unions and exhaustive transitions",
    "concept": "Each state owns only the data that is meaningful in that state.",
    "question": "Which type detects an unhandled union member?",
    "accepted": [
      "never"
    ]
  },
  {
    "number": 44,
    "track": "TypeScript",
    "title": "Branded identifiers, generics, and typed ownership",
    "concept": "A brand distinguishes meanings that share the same runtime representation.",
    "question": "Does a TypeScript brand survive JSON as a runtime check?",
    "accepted": [
      "no"
    ]
  },
  {
    "number": 45,
    "track": "TypeScript",
    "title": "Use the generated SDK without inventing callbacks",
    "concept": "The SDK signature is the executable boundary between a bundle and the server.",
    "question": "What publishes an edited outgoing wrapper?",
    "accepted": [
      "reencode",
      "ctx.reencode()",
      "reencode()"
    ]
  },
  {
    "number": 46,
    "track": "TypeScript",
    "title": "ES modules, satisfies, and reproducible bundle builds",
    "concept": "A bundle is a build artifact with an explicit source entrypoint and an explicit runtime entrypoint.",
    "question": "Which tool performs TypeScript semantic checking?",
    "accepted": [
      "tsc",
      "typescript compiler"
    ]
  },
  {
    "number": 47,
    "track": "Python",
    "title": "Python values, strict integers, and borrowed collections",
    "concept": "Python's convenient coercions are broader than most command contracts.",
    "question": "Is bool a subclass of int in Python?",
    "accepted": [
      "yes"
    ]
  },
  {
    "number": 48,
    "track": "Python",
    "title": "Counters, generators, and deterministic output",
    "concept": "Iteration order is part of an observable result whenever the caller can see it.",
    "question": "Does creating a generator consume every input item immediately?",
    "accepted": [
      "no"
    ]
  },
  {
    "number": 49,
    "track": "Python",
    "title": "Decimal money and timezone-aware instants",
    "concept": "A monetary amount and a timestamp each need a representation that preserves their domain meaning.",
    "question": "Which Python numeric type represents decimal money exactly?",
    "accepted": [
      "decimal",
      "decimal.decimal"
    ]
  },
  {
    "number": 50,
    "track": "Python",
    "title": "Async tasks, ordered results, and structured cancellation",
    "concept": "A task should not outlive the scope that owns its result.",
    "question": "Which asyncio context owns and waits for child tasks?",
    "accepted": [
      "taskgroup",
      "asyncio.taskgroup"
    ]
  },
  {
    "number": 51,
    "track": "Python",
    "title": "Context managers and structural service contracts",
    "concept": "Acquisition and release belong to one scope, even when the body raises.",
    "question": "Which block guarantees cleanup when the body raises?",
    "accepted": [
      "finally",
      "try finally",
      "try/finally"
    ]
  },
  {
    "number": 52,
    "track": "Python",
    "title": "Dataclasses, independent defaults, and Python bundles",
    "concept": "A new domain object must not inherit another instance's mutable state.",
    "question": "What creates an independent dataclass collection default?",
    "accepted": [
      "default_factory",
      "field(default_factory=list)"
    ]
  },
  {
    "number": 53,
    "track": "C",
    "title": "Integer widths, promotions, and total shift functions",
    "concept": "WebAssembly does not repair undefined behavior in C source before compilation.",
    "question": "Is shifting a 64-bit C operand by 64 defined?",
    "accepted": [
      "no"
    ]
  },
  {
    "number": 54,
    "track": "C",
    "title": "Caller-owned bitsets with the Graaly SDK",
    "concept": "A bitset is a logical bit count plus enough words to store those bits.",
    "question": "Does graaly_bitset_init allocate storage?",
    "accepted": [
      "no"
    ]
  },
  {
    "number": 55,
    "track": "C",
    "title": "Union, intersection, difference, and tail padding",
    "concept": "Physical storage may contain bits that do not belong to the logical set.",
    "question": "Which operation computes set union per word?",
    "accepted": [
      "bitwise or",
      "or",
      "|"
    ]
  },
  {
    "number": 56,
    "track": "C",
    "title": "Alignment, offsetof, padding, and fieldwise equality",
    "concept": "A struct layout is an ABI decision; its semantic value is the value of its fields.",
    "question": "Which macro measures a field offset within a struct?",
    "accepted": [
      "offsetof",
      "offsetof()"
    ]
  },
  {
    "number": 57,
    "track": "C",
    "title": "Tagged unions and legal floating-point bit inspection",
    "concept": "The tag tells the reader which payload the producer actually stored.",
    "question": "Which function legally copies float representation into same-sized integer storage?",
    "accepted": [
      "memcpy",
      "memcpy()"
    ]
  },
  {
    "number": 58,
    "track": "C",
    "title": "Byte order, bounded VarInts, and overlap-safe moves",
    "concept": "A wire format is a sequence of bytes with explicit ordering and limits.",
    "question": "Which copy operation permits overlapping ranges?",
    "accepted": [
      "memmove",
      "memmove()"
    ]
  },
  {
    "number": 59,
    "track": "C",
    "title": "Checked allocation, lifetimes, and host handles",
    "concept": "Allocated memory and host handles have separate owners and separate release operations.",
    "question": "Should allocation overflow be checked before or after multiplication?",
    "accepted": [
      "before"
    ]
  },
  {
    "number": 60,
    "track": "C",
    "title": "Implement any Academy contract in real C17",
    "concept": "A JSON harness provides input and output plumbing; your C function still performs the algorithm.",
    "question": "Which language executes the algorithm in the C profile?",
    "accepted": [
      "c",
      "c17"
    ]
  },
  {
    "number": 61,
    "track": "HTML / CSS",
    "title": "Semantic native markup, actions, and accessible names",
    "concept": "Markup describes a native game surface; it does not create a web page inside Minecraft.",
    "question": "Does native Graaly HTML create a browser DOM in Minecraft?",
    "accepted": [
      "no"
    ]
  },
  {
    "number": 62,
    "track": "HTML / CSS",
    "title": "Grid lines, spans, and nested native panels",
    "concept": "An inventory is a bounded nine-column grid with numbered slots.",
    "question": "How many columns does a native inventory row have?",
    "accepted": [
      "9",
      "nine"
    ]
  },
  {
    "number": 63,
    "track": "HTML / CSS",
    "title": "Specificity, source order, inheritance, and native variables",
    "concept": "A computed native style comes from a deliberate cascade, not whichever rule looks closest.",
    "question": "What breaks a tie between equal-specificity CSS rules?",
    "accepted": [
      "source order",
      "order"
    ]
  },
  {
    "number": 64,
    "track": "HTML / CSS",
    "title": "Text input, confirmation, and cancellation contracts",
    "concept": "An input action can complete, cancel, or lose its owning session.",
    "question": "Should cancellation and an empty submitted string be the same state?",
    "accepted": [
      "no"
    ]
  },
  {
    "number": 65,
    "track": "HTML / CSS",
    "title": "Combine an algorithm with checked native HTML and CSS",
    "concept": "JavaScript computes the result; native markup presents the result under a checked UI contract.",
    "question": "What computes the algorithm in the HTML/CSS Academy profile?",
    "accepted": [
      "javascript",
      "js"
    ]
  },
  {
    "number": 66,
    "track": "Pydantic",
    "title": "Strict fields and forbidden extras before side effects",
    "concept": "Validation turns untrusted input into a value that satisfies a declared contract.",
    "question": "Which extra-field policy rejects unknown model fields?",
    "accepted": [
      "forbid",
      "extra='forbid'",
      "extra=forbid"
    ]
  },
  {
    "number": 67,
    "track": "Pydantic",
    "title": "Normalization and cross-field invariants",
    "concept": "Normalize representation first, then enforce invariants on the validated model.",
    "question": "Which validator handles an invariant across multiple fields?",
    "accepted": [
      "model_validator",
      "model validator"
    ]
  },
  {
    "number": 68,
    "track": "Pydantic",
    "title": "Aliases, nested models, and discriminated payloads",
    "concept": "A wire name and an internal field name can differ without becoming two sources of truth.",
    "question": "What selects a discriminated union's payload model?",
    "accepted": [
      "discriminator",
      "tag",
      "discriminator tag"
    ]
  },
  {
    "number": 69,
    "track": "Pydantic",
    "title": "Computed fields, secrets, Decimal, and JSON output",
    "concept": "The public response is a separate schema, rather than a dump of everything the service knows.",
    "question": "Should a secret field be omitted from a response that must not expose it?",
    "accepted": [
      "yes"
    ]
  },
  {
    "number": 70,
    "track": "Pydantic",
    "title": "Frozen models, default factories, and any-exercise validation",
    "concept": "Frozen field assignment and independent mutable defaults solve different problems.",
    "question": "Does a frozen Pydantic model recursively freeze its contained list?",
    "accepted": [
      "no"
    ]
  },
  {
    "number": 71,
    "track": "ASGI",
    "title": "ASGI scopes, byte headers, and explicit routing",
    "concept": "ASGI is an asynchronous message protocol between a server and an application.",
    "question": "Which ASGI argument contains protocol and request metadata?",
    "accepted": [
      "scope"
    ]
  },
  {
    "number": 72,
    "track": "ASGI",
    "title": "Chunked bodies, response ordering, and disconnects",
    "concept": "One HTTP body can arrive as many messages, while one response must still obey a single ordered lifecycle.",
    "question": "Which flag tells ASGI that more body frames follow?",
    "accepted": [
      "more_body"
    ]
  },
  {
    "number": 73,
    "track": "ASGI",
    "title": "Expose any algorithm through a real ASGI application",
    "concept": "The protocol adapter translates messages; the domain function owns the algorithm.",
    "question": "Should domain logic depend on ASGI frame dictionaries?",
    "accepted": [
      "no"
    ]
  },
  {
    "number": 74,
    "track": "SQL",
    "title": "Deterministic leaderboards and outer joins",
    "concept": "Rows have no guaranteed result order until the query declares one.",
    "question": "Which join retains rows with no matching right-hand row?",
    "accepted": [
      "left join",
      "left outer join"
    ]
  },
  {
    "number": 75,
    "track": "SQL",
    "title": "Aggregation, HAVING, and ordered window functions",
    "concept": "Aggregation collapses rows; a window computes over related rows while keeping each row visible.",
    "question": "Which clause filters grouped aggregate results?",
    "accepted": [
      "having"
    ]
  },
  {
    "number": 76,
    "track": "SQL",
    "title": "Atomic stock reservation and rollback",
    "concept": "A purchase either commits all its persistent effects or commits none of them.",
    "question": "Which transaction operation undoes tentative writes?",
    "accepted": [
      "rollback"
    ]
  },
  {
    "number": 77,
    "track": "SQL",
    "title": "Ledger reconciliation and ordered outbox delivery",
    "concept": "Persistent facts and delivery attempts have different lifecycles.",
    "question": "Which pattern persists event delivery intent with a domain transaction?",
    "accepted": [
      "outbox",
      "transactional outbox"
    ]
  },
  {
    "number": 78,
    "track": "Configuration",
    "title": "Bundle manifests, scalar types, and entrypoints",
    "concept": "Configuration is typed input to the loader, not a collection of plausible-looking strings.",
    "question": "Does YAML text 'false' have the same type as boolean false?",
    "accepted": [
      "no"
    ]
  },
  {
    "number": 79,
    "track": "Configuration",
    "title": "Dependencies, load order, and explicit capability gates",
    "concept": "A declared intention to use a feature does not prove that the runtime can provide it.",
    "question": "Which manifest key declares an optional dependency?",
    "accepted": [
      "softdepend"
    ]
  },
  {
    "number": 80,
    "track": "Java",
    "title": "Java host boundaries and a conventional Bukkit companion",
    "concept": "Java implements the host plugin; Graaly guest bundles access that host through the canonical SDK.",
    "question": "Is Java one of Graaly's four guest languages?",
    "accepted": [
      "no"
    ]
  },
  {
    "number": 81,
    "track": "Java",
    "title": "Host thread ownership and listener cleanup",
    "concept": "A callback's thread is part of its contract, not an implementation detail you can ignore.",
    "question": "Should a network callback directly perform arbitrary world mutations?",
    "accepted": [
      "no"
    ]
  },
  {
    "number": 82,
    "track": "Java",
    "title": "Host contract tests and independent ABI evidence",
    "concept": "A guest implementation and the host must agree on behavior, rather than merely sharing a vocabulary.",
    "question": "What kind of fixture helps detect drift against a host compiler?",
    "accepted": [
      "independent fixture",
      "independent fixtures",
      "host-generated fixture",
      "host generated fixture"
    ]
  },
  {
    "number": 83,
    "track": "FastAPI",
    "title": "Typed endpoint signatures, status, and response models",
    "concept": "An endpoint signature declares how protocol input becomes validated application input.",
    "question": "Which FastAPI option validates and filters an endpoint's public output?",
    "accepted": [
      "response_model",
      "response model"
    ]
  },
  {
    "number": 84,
    "track": "FastAPI",
    "title": "Run any Academy algorithm as a FastAPI endpoint",
    "concept": "Changing the execution environment should preserve the exercise's observable domain contract.",
    "question": "Does the FastAPI Academy profile execute the actual FastAPI package?",
    "accepted": [
      "yes"
    ]
  }
];
