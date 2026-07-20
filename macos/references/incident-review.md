# Implementation incident review

The working theme initially failed intermittently despite correct CSS. The final project incorporates the following fixes:

- macOS LaunchServices discarded Chromium debugging flags. The launcher now starts the official executable through a user-level `launchd` job.
- `launchd` jobs did not reliably inherit `HOME`. Shared shell code resolves the current user's home directory when the variable is missing.
- Two shell helpers returned the status of their final conditional expression, reporting failure after successful work. Successful helper paths now return explicitly or end with successful commands.
- The home-suggestion selector was under-escaped inside a CDP JavaScript string. Verification now resolves `.group\\/home-suggestions` correctly and must return `pass: true`.
- A Computer Use child process could inherit the CDP listener. Port ownership now accepts the official Codex process and verified descendants, while rejecting unrelated listeners.
- A large bundled Node binary made GitHub delivery impractical. Version 1.0.0 validates and reuses Codex's own signed Node instead.
- Static preview images were not accepted as release evidence. Final signoff requires JSON from the live DOM verifier plus a CDP screenshot.
