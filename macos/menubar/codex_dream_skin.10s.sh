#!/bin/bash

# SwiftBar controls for CODEX Document Mode. Keep commands local and route all
# process control through the installed engine's existing guarded scripts.

# <swiftbar.hideAbout>true</swiftbar.hideAbout>
# <swiftbar.hideRunInTerminal>true</swiftbar.hideRunInTerminal>
# <swiftbar.hideLastUpdated>true</swiftbar.hideLastUpdated>

set +e

ENGINE="${CODEX_DREAM_SKIN_ENGINE:-$HOME/.codex/codex-dream-skin-studio}"
if [ ! -d "$ENGINE/scripts" ]; then
  HERE="$(cd "$(dirname "$0")" && pwd -P)"
  [ -d "$HERE/../scripts" ] && ENGINE="$(cd "$HERE/.." && pwd -P)"
fi

SCRIPTS="$ENGINE/scripts"
APPLY="$SCRIPTS/apply-from-menubar-macos.sh"
START="$SCRIPTS/start-dream-skin-macos.sh"
PAUSE="$SCRIPTS/pause-dream-skin-macos.sh"
RESTORE="$SCRIPTS/restore-dream-skin-macos.sh"
STATUS="$SCRIPTS/status-dream-skin-macos.sh"
[ -x "$APPLY" ] || APPLY="$START"

if [ ! -x "$APPLY" ] || [ ! -x "$RESTORE" ]; then
  echo "Document Mode ? | sfimage=doc.text"
  echo "---"
  echo "Engine missing"
  exit 0
fi

SESSION="unknown"
OPERATION=""
MESSAGE=""
if [ -x "$STATUS" ]; then
  while IFS= read -r line; do
    case "$line" in
      session=*) SESSION="${line#session=}" ;;
      operation=*) OPERATION="${line#operation=}" ;;
      operation_message=*) MESSAGE="${line#operation_message=}" ;;
    esac
  done < <("$STATUS" 2>/dev/null)
fi

case "$SESSION" in
  active) TITLE="Document Mode ON" ;;
  paused) TITLE="Document Mode Paused" ;;
  *) TITLE="Document Mode" ;;
esac
echo "$TITLE | sfimage=doc.text"
echo "---"
echo "当前预设: CODEX Document | color=#667085"
[ -z "$MESSAGE" ] || echo "$MESSAGE | color=#667085"

case "$OPERATION" in
  applying|pausing)
    echo "正在处理… | color=#98a2b3"
    ;;
  *)
    case "$SESSION" in
      active)
        echo "重新应用 | bash=\"$APPLY\" terminal=false refresh=true"
        echo "暂停 | bash=\"$PAUSE\" terminal=false refresh=true"
        ;;
      paused)
        echo "继续显示 | bash=\"$APPLY\" terminal=false refresh=true"
        ;;
      *)
        echo "应用 Document Mode | bash=\"$APPLY\" terminal=false refresh=true"
        ;;
    esac
    ;;
esac
echo "---"
echo "完整恢复 | bash=\"$RESTORE\" param1=\"--restore-base-theme\" param2=\"--restart-codex\" terminal=false refresh=true"
echo "刷新 | refresh=true"
