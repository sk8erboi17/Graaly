#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SDK="$(cd "$HERE/../../sdk/c" && pwd)"
mkdir -p "$HERE/dist"

if ! command -v zig >/dev/null 2>&1; then
  echo "zig is required for the reference Graaly C build (https://ziglang.org/)." >&2
  exit 1
fi

zig cc \
  -target wasm32-wasi \
  -mexec-model=reactor \
  -O2 \
  -Wall -Wextra -Wpedantic -Wshadow -Wconversion \
  -I"$SDK/include" \
  "$SDK/src/graaly.c" \
  "$HERE/src/main.c" \
  -Wl,--export-memory \
  -o "$HERE/dist/plugin.wasm"

echo "Built $HERE/dist/plugin.wasm"
