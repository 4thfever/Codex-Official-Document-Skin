#!/bin/bash
set -euo pipefail
INSTALLED="$HOME/.codex/codex-dream-skin-studio/scripts/start-dream-skin-macos.sh"
if [ ! -x "$INSTALLED" ]; then
  /usr/bin/osascript -e 'display alert "请先双击 Install Codex Dream Skin.command 完成安装。" as warning' >/dev/null
  exit 1
fi
/usr/bin/osascript -e 'display alert "CODEX Document Mode 使用内置正式文档预设。" message "启动后可通过原生输入区的圈阅板追加同意或不同意反馈。"' >/dev/null
exec "$INSTALLED" --prompt-restart
