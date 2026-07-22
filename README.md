# Codex 正式文风与文档模式

为官方 Codex Desktop 提供两项相互独立的能力：

- **正式文风**：将回复组织为准确、简明、克制的中文书面表达；代码、命令、日志、表格和用户指定格式保持原样。
- **文档模式（Windows）**：通过本机回环 CDP 将助手回复呈现为纸面化文档，并在发送时临时注入文风引导；不修改 Codex 安装文件、`app.asar`、签名、API Key 或 Base URL。

本项目为非官方工具，与 OpenAI 无关。

## 使用正式文风

仓库内置 Codex Skill：[`skills/codex-official-prose-style`](./skills/codex-official-prose-style/)。在支持项目 Skill 的 Codex 会话中，可直接提出类似请求：

```text
使用 $codex-official-prose-style，将下面内容整理为正式、简洁的情况说明：
……
```

文风只是一种写作辅助：不虚构事实、依据、身份或权限；不生成红头、文号、印章、签发等法定公文要素，也不使回复具有任何官方或法律效力。完整规则见[正式文风指南](./docs/codex-official-prose-style-guide.md)。

## 启用 Windows 文档模式

前提：已从 Microsoft Store 安装官方 `OpenAI.Codex`，并已安装 Node.js 22+。关闭 Codex 后，在 PowerShell 中运行：

```powershell
cd .\windows
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\install-dream-skin.ps1
```

安装完成后，通过桌面上的 `Codex Dream Skin` 启动 Codex。首次安装会初始化 `CODEX Document` 预设；该模式只装饰助手消息，原生侧栏、项目、输入框、代码块和复制操作仍保持可用。

恢复官方外观：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\restore-dream-skin.ps1 -RestoreBaseTheme -PromptRestart
```

Windows 的安装、更新、验证、主题切换和排障见 [windows/README.md](./windows/README.md)。文档模式的功能边界和验收标准见 [规格说明](./docs/codex-document-mode-spec.md)。

## 平台与安全

| 内容 | 入口 |
| --- | --- |
| Windows 文档模式与主题工具 | [windows/README.md](./windows/README.md) |
| macOS 主题工具 | [macos/README.md](./macos/README.md) |
| 平台能力与本地路径 | [docs/platforms.md](./docs/platforms.md) |

- CDP 仅监听本机回环地址；开启期间请勿运行不受信任的本机程序。
- 本项目不代理请求，不写入 API Key、认证信息或模型供应商配置。
- 不要提交 `.codex/auth.json`、密钥、日志中的敏感信息或私人对话内容。

## 致谢

- [Codex-Dream-Skin](https://github.com/Fei-Away/Codex-Dream-Skin/tree/main)
- [Naptie/endfield-docmaker](https://github.com/Naptie/endfield-docmaker)
