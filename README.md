<div align="center"><strong><font size="6">Codex公文转换器</font></strong></div>

---

<div align="center">
  <p><strong>让 Codex 向你呈递公文文书并接受你的批示圈阅。</strong></p>
  <p>为 Codex 桌面端提供公文式回复、正式文风与圈阅反馈。</p>
  <p>本机 CDP 注入，不改官方安装包。</p>
  <p>非 OpenAI 官方产品。不修改 <code>.app</code>、<code>app.asar</code> 或 <code>WindowsApps</code>。</p>
</div>

> [!IMPORTANT]
> 该工具仅供娱乐与学习交流之用，请在合理、合法的范围内使用。<br>
> 该工具本身无法在不修改代码的前提下伪造真实文件或在机构签发的文件。<br>
> 因对该工具的不合理使用而产生的任何直接或间接责任、损失或纠纷，使用者自行承担。<br>
> 他人对该仓库代码作出的任何改动、由此产生的风险或后果均与该仓库所有者无关。

## 功能介绍

### 1. 回复变成公文格式

文档模式仅重新组织助手消息，保留用户消息、原生侧栏、项目选择、任务内容和输入框。每条回复会显示题头、称谓、标题、正文与落款，并从回复中的结构化标题信息生成“关于……的……”式标题；流式生成期间会保持落款区域稳定，完成后再补齐结束语、署名和日期。代码块、命令、表格等原有 Markdown 内容仍按其原格式呈现。

![公文格式回复示例](./assets/response.png)

### 2. 遣词酌句向正式公文文风靠拢

发送消息时，工具会临时为当前请求附加正式文风与结构约束，引导回复采用准确、简明、克制的书面表达，并按事项组织层次；发送后会立即恢复原始输入。该约束不改变用户提供的事实、立场、选材或任务，也不改写代码、命令、日志、表格、JSON 和用户指定的输出格式；文风仅用于辅助表达，不虚构机构、身份、依据或文件效力。

### 3. 圈阅表达同意和不同意

在原有 Codex 输入区域左侧加入独立的正方形圈阅区域。画圈表示同意，画叉表示不同意；高置信识别结果会以 `【反馈：同意】` 或 `【反馈：不同意】` 的可编辑文字写入当前输入框，无法判断的笔画不会改动草稿。若开始圈阅时草稿为空，且识别成功并且原生发送按钮可用，工具会通过该原生按钮自动发送一次；已有草稿时只追加反馈，仍由用户决定何时发送。

![输入区左侧的圈阅区域](./assets/input_area.png)

<div align="center">
  <table>
    <tr>
      <td align="center"><img src="./assets/answer-yes.png" alt="圈阅同意" width="180" /></td>
      <td align="center"><img src="./assets/answer-no.png" alt="圈阅不同意" width="180" /></td>
    </tr>
    <tr>
      <td align="center">同意</td>
      <td align="center">不同意</td>
    </tr>
  </table>
</div>

## 安装与使用

请根据所用系统完成安装。安装完成后，从 `Codex Dream Skin` 启动入口打开 Codex，即可正常开始对话；助手回复会自动以公文格式呈现。需要对当前内容给出反馈时，可在输入框左侧的圈阅区域画圈表示同意，画叉表示不同意。

具体安装和使用说明见 [Windows 文档](./windows/README.md) 与
[macOS 文档](./macos/README.md)。

## 备注

- Windows 和 macOS 均提供 CODEX Document Mode；macOS 的自动化 fixture 已覆盖，
  但仍需要真实 Mac 上的官方 Codex Desktop 完成最终实机验收。
- 参考：[Codex-Dream-Skin](https://github.com/Fei-Away/Codex-Dream-Skin/tree/main)。

## 致谢


- [Codex-Dream-Skin](https://github.com/Fei-Away/Codex-Dream-Skin/tree/main) - 提供Codex皮肤功能基建
- [Naptie/endfield-docmaker](https://github.com/Naptie/endfield-docmaker) - 灵感和公文格式来源
