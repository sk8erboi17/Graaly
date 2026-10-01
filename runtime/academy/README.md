# Academy coding runtimes

The documentation contains 208 authored Medium and Hard problems, 665 example/edge cases, progressive hints and editorials. `app/academy/catalog.ts` lists the curriculum; `app/academy/arena.tsx` provides the editor and local progress. All 84 theory lessons and all 14 SDK modules have related exercises. The workbook ZIP contains statements, profile-specific contracts/starters, lesson source examples and generic helper sources.

Every problem has 12 execution profiles: TypeScript, JavaScript, Python, C, React/TS, React/JS, FastAPI, Pydantic, raw ASGI, Graaly plugin/TS, Graaly plugin/JS and HTML/CSS. Dedicated SQL and YAML editors remain available on query and configuration problems. `resolveVariant` selects the actual judge and contract, rather than changing a label on the original runner. Drafts are stored independently per profile; old framework drafts migrate without overwriting user code. Acceptance records the successful profiles as well as overall problem progress.

Framework-specific problems retain their original native implementation in the relevant profile. Other profiles implement equivalent observable JSON behavior: C can implement a reducer's transitions, while React executes the actual component and hooks. FastAPI and ASGI wrappers send a real POST /solve through the protocol harness; React wrappers publish one JSON Message through the production reconciler; plugin wrappers publish one SDK info trace. The UI explains these boundaries alongside the selected contract. Java lessons concern the conventional Bukkit host and local server verification, rather than an additional guest compiler.

The judge executes submitted code. JavaScript and TypeScript use Sucrase and deterministic Graaly SDK adapters. TypeScript is transpiled, without semantic type checking; use the real SDK and `tsc` for production builds. React exercises use the production `runtime/sdk/react` renderer and `react-test` transport, with native actions and commits. Boards stay experimental and unavailable; exercises test their capability gate.

Python 3.14.2 runs in Pyodide 314.0.7. FastAPI 0.136.1 and Pydantic 2.12.5 are actual packages, not request simulations. The trusted ASGI harness drives HTTP bodies, dependency/lifespan cleanup and WebSocket frames. SQL runs on a fresh in-memory SQLite database for each case. Browser versions are declared separately from the production backend versions. HTML/CSS exercises compile Graaly's inventory subset, using an inert DOM; markup is never mounted as page HTML. Java-generated fixtures check parity with `GraalyHtmlUiCompiler`.

C exercises use Clang 22.1.8, LLD and a C-only WASI sysroot, compiling C17 to wasm32. `graaly/bits.h` is the repository's SDK header. Each test executes a fresh compiled module. Tasks include safe shifts, bounded bitsets, set operations, tagged unions, `offsetof`/alignment/padding, fieldwise equality, explicit wire serialization and ownership. Web workers allow Stop/time limits to terminate user code while keeping drafts.

Portable algorithms are authored in the restricted ordinary-Python subset under `runtime/academy/portable/problems/`. `scripts/generate-academy-variants.py` lowers their AST into actual JavaScript and C17 source, failing on unsupported syntax. Generic helpers implement collection, arithmetic, byte/string and SQLite operations; they contain no problem IDs or expected answers. The generated C algorithm executes natively with cJSON input/output, preserves borrowed input and releases all arena roots after serialization. Native C memory exercises keep their typed harnesses, dirty-padding controls and actual target measurements. SQLite queries execute a real engine in Python, sql.js for JS/React/plugin/HTML, and the SQLite amalgamation plus an in-memory-only VFS for C.

The universal HTML/CSS profile uses an Academy-only marked module script for the algorithm. The playground extracts that script, executes it in its worker, escapes its JSON output and compiles the remaining markup into native inventory items. Deployed Graaly native HTML does not execute inline scripts: a JS/TS bundle supplies its behavior through the UI SDK. Original markup-only exercises still compile the original HTML without this adapter.

Assets in `public/academy/runtime` are self-hosted on GitHub Pages. Ordinary builds never download a runtime and do not use an external compiler service. First C/Python execution downloads the corresponding assets from this site; subsequent HTTP caching reduces transfers.

## Build and verify

- `npm run typecheck:academy` checks the authored editor, catalog and runners.
- `npm run test:academy` runs every reference solution through the actual JS/React/YAML, Pyodide and WASI judges, and checks rejected implementations and asset integrity.
- `npm run test:e2e` checks code editing, submission, solution unlocking, persistence, time limits and responsive layouts in a real browser.
- `npm run pages` rebuilds the worker and static site; `npm run package:downloads` rebuilds the workbook and companion ZIPs.
- `npm run generate:academy` regenerates native algorithm sources and the 48 new in-game checkpoints, then stages the pinned local libraries. The regular build runs this before packaging and bundling.
- `node scripts/vendor-academy-python.mjs` refreshes pinned Pyodide assets and verifies wheel hashes from the official release lockfile.
- `python3 scripts/vendor-academy-c.py` reproduces the pinned toolchain (requires Zig 0.16). Upstream release checksums are enforced before extraction.

## Provenance and licenses

The Python distribution is from [official Pyodide 314.0.7](https://github.com/pyodide/pyodide/releases/tag/314.0.7). Release metadata, versions and SHA-256 hashes are recorded in `public/academy/runtime/python/manifest.json`; wheel archives retain their upstream license files. The complete licenses from Pyodide 314.0.7 and CPython 3.14.2 are included alongside the assets and in `licenses/`.

The C distribution is from [wasm-clang-runtime v0.1.0](https://github.com/cppstudio-io/wasm-clang-runtime/releases/tag/v0.1.0), commit `df1180d80184733c6a01599f76b92b4001d20f87`. `compiler/` retains the attributed WASI filesystem shim sources, Apache 2.0 license, LLVM exceptions and NOTICE. Local changes fix wasm32 argument-size writes, supply reactor imports, track directory nodes and configure the C-only sysroot. The filesystem reactor is built from these sources. Binary and upstream hashes are recorded in `public/academy/runtime/c/manifest.json`.

cJSON 1.7.19 is MIT licensed and pinned to commit `c859b25da02955fef659d658b8f324b5cde87be3`. SQLite 3.53.4 is public domain. Their vendored sources, licenses/provenance and upstream hashes are in `runtime/academy/json/` and `runtime/academy/sqlite/`. sql.js 1.14.2 is pinned in package-lock.json; its self-hosted module, Wasm, license and hashes are staged in `public/academy/runtime/sql/`. No ordinary build downloads these libraries.

## Workbook helper usage

For portable Python starters, place `helpers/graaly_academy.py` on PYTHONPATH. Install the actual Pydantic/FastAPI versions required by the profile contract when using those profiles locally. For JS/TS starters, map `@graaly/academy` to the supplied `helpers/portable-helpers.ts` in your bundler; initialize SQLite before a SQL-backed algorithm.

For portable C starters, include `helpers/include`, `helpers/cjson` and `helpers/sqlite`; compile cJSON.c with your C17 compiler and link the math library on platforms that require `-lm`. Supply a small main that parses a fixture with cJSON, calls `solve`, serializes the result and calls `academy_clear`. `j_get` borrows nodes; constructors, cloning and setters belong to the per-case arena. `j_object` takes alternating `J*` keys and values, so use `j_str("field")` for keys. SQL-backed starters additionally link sqlite3.c and, for WASI, academy-vfs.c with `SQLITE_THREADSAFE=0`, `SQLITE_OMIT_LOAD_EXTENSION=1`, `SQLITE_OMIT_WAL=1`, `SQLITE_OS_OTHER=1`, `SQLITE_TEMP_STORE=3`. Native memory starters instead use the typed declarations and print contract included in their profile folder.
