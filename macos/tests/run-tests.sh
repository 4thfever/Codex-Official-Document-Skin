#!/bin/bash

# Portable repository checks. Live Codex and signature checks remain opt-in,
# because GitHub-hosted runners do not include the official desktop app.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
NODE="${NODE:-$(command -v node || true)}"
[ -n "$NODE" ] && [ -x "$NODE" ] || {
  echo "Node.js is required for macOS repository tests." >&2
  exit 1
}

for file in "$ROOT"/scripts/*.sh "$ROOT"/*.command; do
  [ -f "$file" ] || continue
  /bin/bash -n "$file"
done

"$NODE" --check "$ROOT/scripts/injector.mjs"
"$NODE" --check "$ROOT/assets/renderer-inject.js"
"$NODE" --test "$ROOT/tests"/*.test.mjs
"$NODE" "$ROOT/scripts/injector.mjs" --check-payload >/dev/null

if [ "${CODEX_DREAM_SKIN_SKIP_DOCTOR:-0}" != "1" ]; then
  "$ROOT/scripts/doctor-macos.sh"
fi

printf 'PASS: macOS Document Mode repository checks.\n'
