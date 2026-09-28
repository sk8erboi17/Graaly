#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
TMP="${TMPDIR:-/tmp}/graaly-c-sdk-compile"
rm -rf "$TMP"
mkdir -p "$TMP"

compile() {
  zig cc -target wasm32-wasi -O0 -Wall -Wextra -Wpedantic -Werror=implicit-function-declaration \
    -I"$HERE/include" -c "$1" -o "$2"
}

compile "$HERE/tests/core.c" "$TMP/core.o"
compile "$HERE/tests/packets.c" "$TMP/packets.o"
compile "$HERE/tests/raw-opt-in.c" "$TMP/raw-opt-in.o"

if compile "$HERE/tests/raw-hidden.c" "$TMP/raw-hidden.o" >"$TMP/raw-hidden.log" 2>&1; then
  echo "raw reflection API unexpectedly compiled without GRAALY_ENABLE_RAW_ABI" >&2
  exit 1
fi

grep -q "graaly_get" "$TMP/raw-hidden.log"
echo "Graaly C headers compile cleanly; raw reflection is hidden by default."
