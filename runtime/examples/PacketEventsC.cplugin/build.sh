#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SDK="$(cd "$HERE/../../sdk/c" && pwd)"
mkdir -p "$HERE/dist"
zig cc -target wasm32-wasi -mexec-model=reactor -O2 \
  -Wall -Wextra -Wpedantic -Wshadow -Wconversion \
  -I"$SDK/include" "$SDK/src/graaly.c" "$HERE/src/main.c" \
  -Wl,--export-memory -o "$HERE/dist/plugin.wasm"
echo "Built $HERE/dist/plugin.wasm"
