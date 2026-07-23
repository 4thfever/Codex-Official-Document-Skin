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

[ -d "$ROOT/presets/preset-codex-document" ] || {
  echo "Missing bundled CODEX Document preset." >&2
  exit 1
}
[ ! -d "$ROOT/presets/preset-arina-hashimoto" ] || {
  echo "Retired Arina preset is still bundled." >&2
  exit 1
}
[ ! -d "$ROOT/presets/preset-gothic-void-crusade" ] || {
  echo "Retired Gothic preset is still bundled." >&2
  exit 1
}
if /usr/bin/grep -q '"\$presets_root"/preset-\*/' "$ROOT/scripts/common-macos.sh"; then
  echo "Preset seeding must not glob every preset-* directory." >&2
  exit 1
fi
if ! /usr/bin/grep -q 'preset-codex-document' "$ROOT/scripts/common-macos.sh"; then
  echo "CODEX Document preset is not seeded explicitly." >&2
  exit 1
fi

if [ "${CODEX_DREAM_SKIN_SKIP_DOCTOR:-0}" != "1" ]; then
  "$ROOT/scripts/doctor-macos.sh"
fi

printf 'PASS: macOS Document Mode repository checks.\n'
