# Acceptance report — 2026-07-15

## Result

Codex Dream Skin Studio `1.0.0` passed its macOS release checks on the live Codex desktop app during the original private release validation.

- macOS architecture: `arm64`
- Codex version: `26.707.72221`
- Codex signing Team ID: `2DC432GLL2`
- Codex bundled Node.js: `v24.14.0`
- CDP endpoint: loopback port `9341`
- Official app deep signature after installation: valid
- `app.asar` modification: none

## Automated result

历史版本曾运行 `tests/run-tests.sh` 并通过语法、默认和自定义 payload、TOML 往返、缺失 `HOME` 恢复、签名运行时和 doctor 检查。该测试套件已随未维护的 macOS 换肤实现移除，不能作为当前发布结论。

Live doctor returned `pass: true`, `officialAppSignatureValid: true`, `modifiesAppAsar: false`, and `live: true`.

Live renderer verification returned `pass: true` after `Page.reload`:

- injected version `1.0.0`;
- style and decorative chrome present;
- decorative chrome `pointer-events: none`;
- native sidebar and composer visible;
- no horizontal document overflow;
- home banner visible with native suggestion cards and project selector.

## Evidence note (open-source tree)

Private release builds included CDP screenshots under `docs/screenshots/`. Those captures may contain third-party UI chrome and demo art and are **not** shipped in this public tree. Reproduce evidence on your machine:

```bash
~/.codex/codex-dream-skin-studio/scripts/verify-dream-skin-macos.sh \
  --reload --screenshot "$HOME/Desktop/Codex Dream Skin Verification.png"
```
