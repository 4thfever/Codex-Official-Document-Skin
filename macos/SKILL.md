---
name: codex-document-mode-macos
description: Install, launch, verify, repair, update, or restore CODEX Document Mode on macOS. Use when a user wants formal document presentation, prose guidance, or circle/cross feedback in official Codex Desktop without modifying the official app.
compatibility: macOS, official Codex Desktop app, signed bundled Node.js 20 or newer
---

# Codex Dream Skin Studio

This file is an optional Codex capability entry. The delivery is a complete standalone project; users do not need to install it as a Skill.

## Workflow

1. Run `Install Codex Dream Skin.command` from the complete project folder.
2. Run `Start Codex Dream Skin.command` to launch or reapply the bundled `preset-codex-document`.
3. Verify the live result with `Verify Codex Dream Skin.command`. A pass requires a visible native sidebar and composer, no horizontal overflow, and a document shell for assistant messages.
4. Restore the official appearance with `Restore Codex Dream Skin.command`.

## Guardrails

- Never modify the official `.app`, `app.asar`, or its code signature.
- Use the official Codex app's signed Node.js runtime only after validating its signature, Team ID, architecture, and minimum version.
- Bind CDP to loopback, verify that the listener belongs to Codex, and reject non-Codex renderer targets.
- Preserve all native cards, navigation, project selectors, task content, composer controls, and keyboard focus.
- Document mode never paints a full-window wallpaper. Scope its CSS to assistant document shells and the local composer feedback board.
- The prose wrapper is temporary and limited to one real native send action; it must restore the visible original draft on send, pause, remove, reload, reapply, restore, and exit.
- The feedback board recognizes only high-confidence red circles and crosses, appends editable feedback text, and may click only the native send button under the documented empty-draft conditions.
- Keep decoration at `pointer-events: none`.
- Require explicit authorization before restarting an already-running Codex instance.
- Stop an injector only when its recorded PID, executable, command line, and start time all match.

## Key resources

- `README.md`: user installation and customization guide.
- `scripts/injector.mjs`: CDP connection, injection, removal, verification, and screenshots.
- `assets/dream-skin.css`: live native interface styling.
- `assets/renderer-inject.js`: idempotent DOM integration and cleanup.
- `scripts/doctor-macos.sh`: signed-runtime, payload, and optional live-session self-check.
- `references/qa-inventory.md`: release and visual acceptance criteria.
