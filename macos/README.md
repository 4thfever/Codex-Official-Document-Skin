# CODEX Document Mode for macOS

这是官方 Codex Desktop 的非官方本地呈现工具。它通过仅绑定
`127.0.0.1` 的 Chromium DevTools Protocol（CDP）把助手回复呈现为克制的
文档式版面，并提供正式文风包装和输入区圈阅反馈。

它不会修改官方 `.app`、`app.asar` 或代码签名，也不会改写 API Key、Base
URL、网络请求或既有会话。

## 需要条件

- macOS，已安装并至少启动一次官方 Codex Desktop（bundle id
  `com.openai.codex`）。
- 不需要全局 Node.js。安装器会校验并使用官方应用内置的已签名 Node。
- 安装与恢复期间请关闭 Codex；首次以 CDP 启动已打开的 Codex 时会请求确认。

## 安装与使用

从完整项目目录执行：

```bash
./scripts/install-dream-skin-macos.sh --no-launch
```

安装器复制受管运行时到 `~/.codex/codex-dream-skin-studio`，并创建桌面入口：

- `Codex Dream Skin.command`：启动或重新应用 CODEX Document Mode。
- `Codex Dream Skin - Verify.command`：检查当前 CDP 会话和注入状态，并保存截图。
- `Codex Dream Skin - Restore.command`：移除注入并恢复官方外观。

首次安装会激活唯一受支持的 `preset-codex-document`。主题包含题头、称谓、
结束语、署名、纸面和印章红等显示配置；默认值见
[`assets/theme.json`](./assets/theme.json)。

## 更新与版本一致性

每次更新项目后，先退出 Codex，再重新运行安装命令。安装器会原子替换
`~/.codex/codex-dream-skin-studio` 中的受管运行时，并重新部署
`preset-codex-document`。不要手动只覆盖 `assets`、`renderer-inject.js` 或单个预设：
注入器与渲染脚本必须来自同一次安装，混用版本可能导致验证失败或缺少渲染占位符。

若升级后未出现新的文档行为、验证报告版本不一致，或落款仍是旧默认值，请再次关闭
Codex 后重新运行安装命令，再从新生成的桌面启动器打开。默认落款为
`山姆·奥特曼`；安装流程不会覆盖用户已经自定义的主题字段。

## 文档模式行为

- 仅将助手消息呈现为题头、标题、称谓、正文和落款；用户消息和原生导航、
  项目选择、任务、代码块、输入框仍由官方应用负责。
- 当前会话中，原生发送动作会临时附带正式文风规则，并要求模型先返回唯一的
  `codex_document.title` JSON 元数据。原始输入在发送后立即恢复，不会写入
  `config.toml` 或修改网络请求。
- Composer 工具区旁有一个独立红圈/红叉画板。高置信圈追加 `【反馈：同意】`，
  高置信叉追加 `【反馈：不同意】`；低置信笔画不修改草稿。只有草稿原本为空、
  反馈已写入且原生发送按钮可用时，才会通过该原生按钮自动发送一次。
- 暂停、恢复、页面重载或退出时都会移除画板、发送监听和临时 wrapper。

完整边界和验收条件见
[`../docs/codex-document-mode-spec.md`](../docs/codex-document-mode-spec.md)。

## 验证与恢复

命令行验证：

```bash
~/.codex/codex-dream-skin-studio/scripts/verify-dream-skin-macos.sh \
  --screenshot "$HOME/Desktop/Codex Document Verification.png"
```

验证会检查官方应用身份、loopback CDP、样式注入、原生侧栏/输入框、文档壳和
横向溢出。验证不发送键盘、鼠标或网络请求。

恢复官方外观：

```bash
~/.codex/codex-dream-skin-studio/scripts/restore-dream-skin-macos.sh \
  --restore-base-theme --restart-codex
```

## 安全边界

1. CDP 仅在 `127.0.0.1` 监听；其本身没有同用户认证，不用时请 Restore。
2. 注入器只连接已校验的 `app://` Codex renderer，并验证官方应用、内置 Node、
   PID、可执行路径和启动时间。
3. pause/restore 只会结束记录中身份完全匹配的 watcher；无法证明归属时会停止并
   保留状态，不会误杀未知进程。
4. `config.toml` 仅在明确的安装/恢复流程内以严格 UTF-8、锁和原子替换处理。

## ��移说明

macOS `1.5.0` 与 Windows 当前版本对齐，已从旧的全窗口壁纸主题器迁移到
CODEX Document Mode。旧 `custom-*` 和图片主题文件会保留在主题库中，但不再是
可运行模式，也不会被自动删除或转换。
