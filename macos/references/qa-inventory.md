# CODEX Document Mode macOS QA

## Automated checks

- `node --test macos/tests/*.test.mjs`
- `node macos/scripts/injector.mjs --check-payload`
- `bash -n macos/scripts/*.sh macos/*.command`
- macOS GitHub Actions runs the repository fixture suite without requiring an
  installed Codex app or a global Node runtime.

## Required live checks

1. Install from a clean extracted copy, start the official app with loopback
   CDP, then pass `verify-dream-skin-macos.sh`.
2. A normal assistant response has a document header, metadata-derived title,
   greeting and footer. User messages are not decorated.
3. A streaming response does not show a completed footer until the stream is
   complete. Invalid or absent metadata must not produce a guessed title.
4. Click-send and Enter-send leave the visible original composer draft intact
   after the temporary prose wrapper is removed.
5. A high-confidence circle appends `【反馈：同意】`; a high-confidence cross
   appends `【反馈：不同意】`; open, ambiguous or empty strokes do nothing.
6. Auto-send occurs only for an initially empty composer with a visible appended
   feedback token and an enabled native send button. It must use that native
   button, not a synthetic Enter event or network request.
7. Pause, reload, reapply, remove and restore remove the document DOM, feedback
   board and send listeners. Native sidebar, task controls, composer, menus and
   keyboard focus remain functional.
8. `codesign --verify --deep --strict <official-app>` remains successful and
   Restore closes the debug session before reopening Codex normally.

## Release evidence

- Capture a redacted CDP screenshot and verifier JSON on a current macOS Codex
  build. Record CPU architecture and Codex version.
- Run install → verify → reload verify → pause/resume → restore → reinstall.
- Test at least Apple Silicon. Intel is additional compatibility coverage.
