# Graaly JVM compatibility

Verified on 2026-08-24 with the release build compiled for Java 17 (`class` major 61), the pinned external Graal 25.2.4 runtime cache, JavaScript and Python enabled, command probes, tasks, entities, attributes, unsupported-feature checks, reload, and clean shutdown.

| JVM | Representative server | Runtime path | Result | Missing markers | Fatal signals |
|---:|---:|---|---:|---:|---:|
| 17 | 1.20.4 | interpreter fallback | PASS | 0 | 0 |
| 21 | 1.21.4 | interpreter fallback | PASS | 0 | 0 |
| 25 | 1.7.10–26.2 (67 JARs) | optimized when supported by the installed JVM | PASS 67/67 | 0 | 0 |
| 26 | 26.2 | interpreter fallback | PASS | 0 | 0 |

Java 17 is Graaly's functional minimum. A server release can impose a higher JVM minimum of its own. Graal 25.2.4 exposes its optimized execution path on Java 25; the other tested JVM feature versions remain functionally compatible but can execute guest code more slowly through the interpreter fallback.

The full per-server evidence is in [MATRIX.md](MATRIX.md). PacketEvents 2.13.0 on server 26.2 and Java 25 is recorded in [packetevents-26.2.json](packetevents-26.2.json).
