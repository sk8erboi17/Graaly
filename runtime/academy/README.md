# Academy coding runtimes

The documentation contains 208 authored Medium and Hard problems, 665 example/edge cases, progressive hints and editorials. `app/academy/catalog.ts` lists the curriculum; `app/academy/arena.tsx` provides the editor and local progress. All 36 theory lessons and all 14 SDK modules have related exercises. The workbook ZIP contains statements and starter files.

The judge executes submitted code. JavaScript and TypeScript use Sucrase and deterministic Graaly SDK adapters. TypeScript is transpiled, without semantic type checking; use the real SDK and `tsc` for production builds. React exercises use the production `runtime/sdk/react` renderer and `react-test` transport, with native actions and commits. Boards stay experimental and unavailable; exercises test their capability gate.

Python 3.14.2 runs in Pyodide 314.0.7. FastAPI 0.136.1 and Pydantic 2.12.5 are actual packages, not request simulations. The trusted ASGI harness drives HTTP bodies, dependency/lifespan cleanup and WebSocket frames. SQL runs on a fresh in-memory SQLite database for each case. Browser versions are declared separately from the production backend versions. HTML/CSS exercises compile Graaly's inventory subset, using an inert DOM; markup is never mounted as page HTML. Java-generated fixtures check parity with `GraalyHtmlUiCompiler`.

C exercises use Clang 22.1.8, LLD and a C-only WASI sysroot, compiling C17 to wasm32. `graaly/bits.h` is the repository's SDK header. Each test executes a fresh compiled module. Tasks include safe shifts, bounded bitsets, set operations, tagged unions, `offsetof`/alignment/padding, fieldwise equality, explicit wire serialization and ownership. Web workers allow Stop/time limits to terminate user code while keeping drafts.

Assets in `public/academy/runtime` are self-hosted on GitHub Pages. Ordinary builds never download a runtime and do not use an external compiler service. First C/Python execution downloads the corresponding assets from this site; subsequent HTTP caching reduces transfers.

## Build and verify

- `npm run typecheck:academy` checks the authored editor, catalog and runners.
- `npm run test:academy` runs every reference solution through the actual JS/React/YAML, Pyodide and WASI judges, and checks rejected implementations and asset integrity.
- `npm run test:e2e` checks code editing, submission, solution unlocking, persistence, time limits and responsive layouts in a real browser.
- `npm run pages` rebuilds the worker and static site; `npm run package:downloads` rebuilds the workbook and companion ZIPs.
- `node scripts/vendor-academy-python.mjs` refreshes pinned Pyodide assets and verifies wheel hashes from the official release lockfile.
- `python3 scripts/vendor-academy-c.py` reproduces the pinned toolchain (requires Zig 0.16). Upstream release checksums are enforced before extraction.

## Provenance and licenses

The Python distribution is from [official Pyodide 314.0.7](https://github.com/pyodide/pyodide/releases/tag/314.0.7). Release metadata, versions and SHA-256 hashes are recorded in `public/academy/runtime/python/manifest.json`; wheel archives retain their upstream license files. The complete licenses from Pyodide 314.0.7 and CPython 3.14.2 are included alongside the assets and in `licenses/`.

The C distribution is from [wasm-clang-runtime v0.1.0](https://github.com/cppstudio-io/wasm-clang-runtime/releases/tag/v0.1.0), commit `df1180d80184733c6a01599f76b92b4001d20f87`. `compiler/` retains the attributed WASI filesystem shim sources, Apache 2.0 license, LLVM exceptions and NOTICE. Local changes fix wasm32 argument-size writes, supply reactor imports, track directory nodes and configure the C-only sysroot. The filesystem reactor is built from these sources. Binary and upstream hashes are recorded in `public/academy/runtime/c/manifest.json`.
