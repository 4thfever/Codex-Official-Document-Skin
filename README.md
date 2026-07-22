# Codex 公文皮肤

[![支持平台](https://img.shields.io/badge/%E6%94%AF%E6%8C%81%E5%B9%B3%E5%8F%B0-Windows-0078D4?logo=windows&logoColor=white)](./windows/README.md)
[![开发状态](https://img.shields.io/badge/%E5%BC%80%E5%8F%91%E7%8A%B6%E6%80%81-%E5%AE%9E%E9%AA%8C%E6%80%A7-8B1E1E)](./docs/codex-document-mode-spec.md)

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

助手回复会以题头、标题、称谓、正文和落款的形式呈现，让内容更接近正式文档的阅读体验。

![公文格式回复示例](./assets/response.png)

### 2. 遣词酌句向正式公文文风靠拢

回复会尽量采用准确、简明、克制的书面表达，按事项组织层次；代码、命令、表格等内容仍保持原有格式。文风只用于辅助表达，不虚构事实、身份、依据或文件效力。

### 3. 圈阅表达同意和不同意

在原有 Codex 输入区域左侧加入正方形圈阅区域。画圈表示同意，画叉表示不同意；识别结果会以可编辑文字写入当前输入框。

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

## 备注

- 当前主要面向 Windows；macOS 版本未经测试，欢迎贡献代码。
- 具体安装和使用说明见 [Windows 文档](./windows/README.md)。
- 参考：[Codex-Dream-Skin](https://github.com/Fei-Away/Codex-Dream-Skin/tree/main)。

## 致谢


- [Codex-Dream-Skin](https://github.com/Fei-Away/Codex-Dream-Skin/tree/main) - 提供Codex皮肤功能基建
- [Naptie/endfield-docmaker](https://github.com/Naptie/endfield-docmaker) - 灵感和公文格式来源
