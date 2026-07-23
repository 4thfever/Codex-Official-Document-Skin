# Windows 安装与使用体验改造规格

## 状态

**已实现，待实机签收。** 本规格定义 Windows `CODEX Document` 模式的安装前预检、安装、日常启动和维护体验改造。它不改变公文模式的 renderer 行为、CDP 安全边界或官方 Codex Desktop 的安装方式。

本规格完成后，普通用户应能先获得明确的本机环境结论，再执行安装和日常启动；开发者仍可从源码目录直接调用现有脚本和运行测试。

## 背景

当前 Windows 安装器已经具备受管运行时复制、配置备份、CDP 回环校验、进程身份校验、快捷方式和恢复流程。但新用户遇到缺少 Node、Codex 未退出、配置文件不存在、执行策略受限、端口冲突或残留 state 时，错误分散在不同脚本中，且不总能在写配置或创建快捷方式之前得到可操作说明。

仓库还保留了已不符合 `CODEX Document` 定位的历史主题资产和文档描述。它们必须在本次改造中清理，避免首次安装时的产品预期与实际主题库不一致。

## 目标

1. 提供一个不修改本机状态的 Windows 预检入口，给出中文、可执行的结果。
2. 让安装器在修改配置、状态目录或快捷方式之前复用同一套关键预检。
3. 保留现有开发者直接运行脚本、指定端口、使用临时 profile、前台运行 injector 和测试的能力。
4. 清除 Windows 版不再支持的桥本有菜、Arina Hashimoto、Gothic Void Crusade / 哥特虚空远征主题资产、实现和产品文案。
5. 在实现完成后，仅更新 README 中与安装、启动、验证、恢复和排障直接相关的部分；不改动用户手写的引言、提醒、功能介绍、引用、致谢或其他叙述。

## 非目标

- 不指导、下载、安装、更新、登录、注册、激活或修复 Codex Desktop。
- 不将任意本地可执行文件当作 Codex；继续只接受当前用户注册且满足现有身份校验的官方 `OpenAI.Codex` Store 包。
- 不自动安装、更新或修改 Node.js，不修改用户或系统 `PATH`。
- 不修改机器、用户或企业 PowerShell 执行策略，不要求管理员权限，也不规避组策略、AppLocker、WDAC、EDR 或 Microsoft Store 限制。
- 不自动创建、猜测、迁移或填充 `%USERPROFILE%\.codex\config.toml`。文件不存在或格式不受安全行编辑器支持时，只报告原因和下一步。
- 不改变现有 CDP 只绑定 `127.0.0.1`、包身份验证、进程停止验证、配置原子写入、备份恢复和状态清理的安全约束。
- 不修改 macOS 实现和文档，除非某个跨平台文档事实必须随 Windows 历史主题清理而修正。
- 不增加静默常驻服务、开机启动项、联网遥测、遥控更新或外部网络请求。

## 用户与入口

### 普通用户

普通用户的推荐顺序固定为：

```text
预检 -> 安装 -> 从“Codex Dream Skin”快捷方式启动 -> 可选验证 -> Restore 恢复
```

预检和安装命令仍从源码 `windows` 目录运行；安装完成后，日常使用以已创建的快捷方式为主。受管运行时继续位于 `%LOCALAPPDATA%\CodexDreamSkin\engine`，安装成功后不依赖源码目录。

### 开发者与维护者

以下现有入口和行为必须保留：

- `scripts\install-dream-skin.ps1` 与 `-Port`、`-NoShortcuts`。
- `scripts\start-dream-skin.ps1` 与 `-Port`、`-RestartExisting`、`-PromptRestart`、`-ProfilePath`、`-ForegroundInjector`。
- `scripts\verify-dream-skin.ps1` 与 `-Port`、`-ScreenshotPath`。
- `scripts\restore-dream-skin.ps1` 与 `-Port`、`-Uninstall`、`-RestoreBaseTheme`、`-RecoverConfigBackup`、`-PromptRestart`、`-ForceRestart`、`-NoRelaunch`。
- `tests\run-tests.ps1` 以及现有 Node renderer / injector 回归测试。

预检应提供可供自动化调用的模式，但默认输出不得牺牲普通用户可读性。

## 预检设计

### 新入口

新增：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\doctor-dream-skin.ps1
```

建议参数：

```powershell
-Port <int>
-For <install|start|verify>
-Json
```

- `-For` 默认 `install`。它决定哪些结果是阻断项，例如安装要求 Codex 已完全退出，而 start 可报告并交由现有重启确认流程处理。
- `-Port` 沿用当前端口范围校验；未显式指定时，报告首选端口的状态，并说明启动器会自行扫描候选端口。
- `-Json` 只面向 CI、脚本和维护者，输出稳定 schema；默认模式输出简洁中文结果。

不新增要求用户记忆的参数。README 的普通流程只使用无参数 `doctor`。

### 检查项

所有检查均为只读，不得创建 `%LOCALAPPDATA%\CodexDreamSkin`、备份、快捷方式、临时 profile 或 CDP 进程。

| 检查 | 通过条件 | 未通过时的动作建议 |
| --- | --- | --- |
| 官方包 | 当前用户存在可验证的 `OpenAI.Codex` Store 包，包身份与可执行文件结构符合现有校验 | 说明本工具只支持已安装且已注册的官方 Store Codex；不提供安装教程 |
| Node | `node.exe` / `node` 在 `PATH` 中，实际 `process.execPath` 可用，主版本至少为 22 | 说明需要可用的 Node.js 22 或更高版本，并提示重新打开 PowerShell 以刷新 PATH |
| Codex 进程 | `-For install` 时没有当前包或可验证旧 state 包的运行中进程 | 提示关闭所有 Codex 窗口后重试；不在 doctor 中关闭进程 |
| 配置文件 | `%USERPROFILE%\.codex\config.toml` 存在、严格 UTF-8 可读、可通过现有安全 TOML 形状检查 | 提示先正常完成已有 Codex 的初始化后重试，或按具体不支持的 TOML 形状手工整理；不创建、不改写该文件 |
| 执行策略 | 明确报告当前有效执行策略和是否允许已安装、解除下载标记后的 `RemoteSigned` 脚本运行 | 报告企业或本机策略可能阻断日常快捷方式；不得建议绕过企业策略 |
| 端口 | 指定端口范围合法；如端口已监听，报告占用状态与启动器的默认扫描行为 | 显式端口被未知监听器占用时提示选另一个端口；不终止未知进程 |
| 状态 | 若存在 `state.json`，验证可读取性、schema 和记录的 injector/包身份；报告可恢复、陈旧或需人工处理状态 | 不在 doctor 中归档、删除 state 或停止进程；将实际安全清理继续交给现有 start / restore |
| 受管目录 | 若状态根已存在，报告无法安全使用的 junction、symbolic link 或文件/目录冲突 | 提示人工检查该受管目录；不得自动删除 |

预检不得探测或打开 CDP endpoint，除非未来新增明确的 `-For verify` 活动会话检查；该模式也必须只读且复用现有 loopback、端口、Browser ID 与包归属验证。

### 输出与退出码

默认输出以检查项为单位，每项仅输出 `PASS`、`ACTION REQUIRED` 或 `UNSUPPORTED`，加一句原因和下一步。不得输出 `auth.json`、令牌、对话内容、完整环境变量或用户文件内容。

建议 JSON schema：

```json
{
  "schemaVersion": 1,
  "target": "install",
  "ready": false,
  "checks": [
    {
      "id": "node",
      "status": "action-required",
      "message": "需要 Node.js 22 或更高版本，当前 PATH 中未找到 node.exe。"
    }
  ]
}
```

退出码：

| 退出码 | 含义 |
| --- | --- |
| `0` | 所有对当前 `-For` 目标必需的检查通过 |
| `2` | 存在用户可处理的前置条件，例如 Node 缺失、Codex 未退出或 config 不存在 |
| `3` | 当前环境不受支持或不允许安全操作，例如未验证包、策略阻断、受管目录含 reparse point |
| `1` | doctor 自身异常或无法完成检查 |

安装器不应仅按退出码显示泛化错误；它应展示 doctor 已生成的可读消息，随后以非零状态退出。

## 实现架构

### 共享检查层

在 `scripts\common-windows.ps1` 中新增最小、可复用的预检函数组；函数必须返回对象，禁止直接 `exit`。建议的职责边界：

```text
common-windows.ps1
  Get-DreamSkinPreflightReport
  Test-DreamSkinPrerequisite*
  Format-DreamSkinPreflightReport

doctor-dream-skin.ps1
  参数解析、调用共享层、默认/JSON 输出、退出码

install-dream-skin.ps1
  调用 install 预检；仅 ready 后进入既有事务

start-dream-skin.ps1
  只复用 start 所需的前置检查，不替代既有重启授权、状态验证和回滚
```

预检函数应复用而不是复制以下既有安全逻辑：`Get-DreamSkinNodeRuntime`、`Get-DreamSkinRegisteredCodexInstalls`、`Get-DreamSkinCodexProcesses`、`Assert-DreamSkinPort`、配置 UTF-8 / TOML 检查以及受管路径检查。

若现有配置检查只能通过会写备份的高层函数触发，应将纯读取和纯形状验证提取为独立函数；doctor 不得调用 `Install-DreamSkinBaseTheme`。

### 安装器集成

安装脚本在获得 operation lock 后、创建状态根和调用 `Install-DreamSkinRuntimeEngine` 之前运行 `Get-DreamSkinPreflightReport -For install`。

- 预检失败时不创建状态目录、不复制运行时、不修改 `config.toml`、不创建快捷方式、不启动托盘。
- 预检成功后，保留当前安装事务、哈希校验、原子替换、下载标记处理、配置备份和快捷方式逻辑。
- 安装器不需要要求用户先手动执行 doctor；doctor 是推荐入口，安装器的集成防止绕过。
- 安装器显示的失败信息应与 doctor 默认输出一致，避免两套排障文案漂移。

### 启动与验证集成

启动器保留现有“已运行且未开启验证 CDP 时询问是否重启”的语义。它只能在必要时调用轻量前置检查，不能因为 doctor 的 install 规则而拒绝可通过 `-PromptRestart` 或 `-RestartExisting` 正常处理的会话。

验证器继续要求活动、已验证的 CDP 会话。其错误可增加 doctor/启动快捷方式提示，但不得把 verify 变成会启动或重启 Codex 的命令。

### 用户包装入口

本阶段不强制新增额外包装脚本。现有 `install`、快捷方式和 `start` 已足以作为稳定入口；先通过 `doctor` 和安装器集成降低复杂度。

仅当实现后仍需减少用户命令数量时，才可另行评审一个轻量包装脚本。它必须只串联 `doctor -> install` 或 `doctor -> start`，展示每一步，不得隐藏 `-ExecutionPolicy`、自动关闭 Codex 或扩展权限。

## 历史主题清理

Windows 版的唯一内置主题为 `preset-codex-document`。实施时必须：

1. 删除 `windows\presets\preset-gothic-void-crusade\` 及任何不再被 `CODEX Document` 使用的背景资产。
2. 删除 Windows 脚本、测试、文档和 changelog 中对桥本有菜、Arina Hashimoto、Gothic Void Crusade、哥特虚空远征及相应 preset ID 的承诺。
3. 复核 `Initialize-DreamSkinThemeStore` 只播种 `preset-codex-document`，且安装后的 `active-theme` 与 saved theme 一致。
4. 保留用户自行导入、保存和切换的主题能力，只要它不与 document-mode 的视觉约束冲突；不再把历史内置主题作为产品功能宣传。
5. 删除后重新执行运行时复制测试，确认 `Install-DreamSkinRuntimeEngine` 的 required 文件清单和实际目录完全一致。

macOS 资产和 macOS 独立功能不在此规格的删除范围内。跨平台文档不得再把 macOS 预设错误描述为 Windows 首装行为。

## 文档变更边界

文档改动必须在代码和测试实现完成后进行，并严格遵守以下边界。

### 可以修改

- 根目录 `README.md` 的 `## 安装与使用` 小节及其直接指向 Windows / macOS 安装文档的链接说明。
- `windows/README.md` 与 `windows/README.en.md` 中的运行要求、安装、更新、启动与验证、恢复、文件与日志位置、常见问题和安全边界。
- 与 Windows 行为事实相关的 `docs/platforms.md`、`windows/references/qa-inventory.md`、`windows/references/runtime-notes.md`、`windows/CHANGELOG.md`、`windows/SKILL.md`。

### 禁止修改

除非用户另行明确授权，根目录 `README.md` 的下列内容必须原样保留：

- 标题、引言和产品概述。
- `IMPORTANT` 提醒与免责声明。
- 功能介绍及其图文说明。
- 备注、引用、致谢和外部链接。
- 用户手写的任何非安装、非使用操作文案。

README 的安装说明不得教用户如何安装 Codex，只可说明本工具依赖用户已经拥有的、受支持的 Codex 环境，并将未满足条件的用户引导到 `doctor` 的本机诊断结果。

### README 推荐结构

Windows README 的最终顺序建议为：

```text
运行要求
首次使用：运行 doctor
安装
日常启动
验证（可选，但建议用于排障）
更新
恢复与卸载快捷方式
主题操作
日志位置
常见问题
安全边界
开发者测试
```

首次使用的最短命令示例为：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\doctor-dream-skin.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\install-dream-skin.ps1
```

文档应说明：doctor 只检查本机是否满足本工具条件；它不会安装、下载或配置 Codex。若 doctor 发现 `config.toml` 不存在，只提示用户完成其已有 Codex 的正常初始化后再重试，不说明具体登录、安装或注册步骤。

## 测试与验收

### 自动化测试

扩展 `windows/tests/run-tests.ps1`，覆盖：

- Node 缺失、Node 版本低于 22、有效 Node 的报告和退出码。
- 未找到官方包、非 Store / 无效包、有效包的报告。
- 安装目标下 Codex 正在运行的阻断；启动目标下同一情况保留给既有重启流程处理。
- `config.toml` 缺失、无效 UTF-8、NUL / UTF-16、受支持 TOML、现有安全编辑器拒绝的歧义 TOML。
- 显式非法端口、显式占用端口、未显式默认端口扫描信息。
- 可读 state、损坏 state、身份不匹配的活 injector、陈旧 state、受管目录 reparse point。
- `-Json` 的 schema、敏感字段缺失和退出码稳定性。
- 安装器在预检失败时没有创建 `%LOCALAPPDATA%\CodexDreamSkin`、未写 `config.toml`、未创建快捷方式、未启动托盘。
- 现有 `-NoShortcuts`、`-ProfilePath`、`-ForegroundInjector`、恢复和 injector 回归测试继续通过。
- 主题清理后受管运行时复制、主题初始化和 payload 自检继续通过，且只存在 `preset-codex-document` 内置主题。

测试须使用临时目录与 mock / 可注入的系统查询边界；不得要求 CI 机器安装真实 Store Codex 或实际开放 CDP。

### Windows 实机签收

发布前仍需在至少一个标准 Windows 用户账户上进行以下手工验收：

1. 已有受支持 Codex、Node 22 和可生成的 `config.toml` 时，doctor 返回 ready，安装成功，快捷方式可启动并完成 verify。
2. Codex 未退出、Node 缺失、config 不存在、显式端口被占用、RemoteSigned 被策略阻断时，doctor 给出正确且不越界的说明，且未改动用户状态。
3. 安装器在上述阻断条件下不写配置、不创建受管运行时或快捷方式。
4. 开发者从源码运行全部 Windows 测试、前台 injector 和自定义 profile 的流程不回归。
5. Restore 继续关闭验证过的 CDP 会话、停止验证过的 injector，并正常恢复官方 Codex 外观。

## 实施顺序

1. 清理 Windows 历史主题资产和错误引用，先让产品范围与代码一致。
2. 抽取纯读取的配置与环境检查函数，定义预检报告对象。
3. 实现 `doctor-dream-skin.ps1` 的默认输出、JSON 输出和退出码。
4. 在安装器的任何写操作之前接入 install 预检。
5. 仅在不改变现有语义的前提下，为启动和验证补充共享前置诊断。
6. 添加单元 / 集成边界测试，并运行现有完整 Windows 回归套件。
7. 按“文档变更边界”更新安装和使用说明，修正平台与主题事实，不改动根 README 的用户手写内容。
8. 完成标准 Windows 账户的手工签收后发布。

## 完成定义

以下条件同时满足时，本规格完成：

- 普通用户可在安装前运行一个只读命令，获得是否可安装的明确结果和非越界建议。
- 安装器无法绕过关键预检，且预检失败没有任何安装副作用。
- 开发者现有脚本、参数和测试入口仍保持可用。
- Windows 主题库和文档不再声明或携带已移除的历史内置主题。
- README 的改动仅限安装和使用相关区域，根 README 的引言、提醒、功能介绍、引用和致谢保持原样。
- 自动化回归和 Windows 实机签收均通过。
