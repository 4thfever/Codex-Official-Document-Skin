# 预设主题 · Preset Packs

macOS 当前只内置并播种 `preset-codex-document/`。安装时，
`install-dream-skin-macos.sh` 会将该预设复制到用户主题库：

```text
~/Library/Application Support/CodexDreamSkinStudio/themes/preset-codex-document/
```

首次安装会激活该主题。它是 `CODEX Document` 模式的唯一受支持内置主题，不使用全窗口艺术背景。

安装器会按固定 ID 移除两套已废弃的历史内置主题：

- `preset-arina-hashimoto`
- `preset-gothic-void-crusade`

清理只针对上述固定 ID；不会删除 `custom-*` 主题、用户导入图片或其他用户创建的主题。

## 预设结构

```text
preset-codex-document/
├── theme.json
└── background.jpg
```

`background.jpg` 是经过注入器校验的占位资源；文档模式不把它作为整窗艺术背景。`theme.json` 中的题头、称谓、落款和纸面颜色构成文档模式默认显示。

维护者可用以下命令校验内置主题：

```bash
node macos/scripts/injector.mjs --check-payload \
  --theme-dir macos/presets/preset-codex-document/
```

用户定制主题仍通过菜单栏或定制脚本创建并保存到用户主题库，不应通过向本目录添加 `preset-*` 文件夹的方式扩展安装器行为。
