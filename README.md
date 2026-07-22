# Codex 公文皮肤

[![Platform](https://img.shields.io/badge/platform-Windows-0078D4?logo=windows&logoColor=white)](./windows/README.md)
[![Status](https://img.shields.io/badge/status-experimental-8B1E1E)](./docs/codex-document-mode-spec.md)

> [!IMPORTANT]
> 该工具仅供娱乐与学习交流之用，请在合理、合法的范围内使用。<br>
> 该工具本身无法在不修改代码的前提下伪造真实文件或在机构签发的文件。<br>
> 因对该工具的不合理使用而产生的任何直接或间接责任、损失或纠纷，使用者自行承担。<br>
> 他人对该仓库代码作出的任何改动、由此产生的风险或后果均与该仓库所有者无关。

将 Codex 的回复呈现为克制、正式的公文风格。本项目为非官方工具，与 OpenAI 无关。

## 功能介绍

### 1. 回复变成公文格式

助手回复会以题头、标题、称谓、正文和落款的形式呈现，让内容更接近正式文档的阅读体验。

![公文格式回复示例](./assets/response.png)

### 2. 遣词酌句向正式公文文风靠拢

回复会尽量采用准确、简明、克制的书面表达，按事项组织层次；代码、命令、表格等内容仍保持原有格式。文风只用于辅助表达，不虚构事实、身份、依据或文件效力。

### 3. 圈阅表达同意和不同意

可在输入区圈阅：画圈表示同意，画叉表示不同意。识别结果会以可编辑文字写入当前输入框。

<div align="center">
  <img src="./assets/answer-yes.png" alt="圈阅同意" width="180" />
  <img src="./assets/answer-no.png" alt="圈阅不同意" width="180" />
</div>

## 备注

- 当前主要面向 Windows；macOS 版本未经测试，欢迎贡献代码。
- 具体安装和使用说明见 [Windows 文档](./windows/README.md)。
- 参考：[Codex-Dream-Skin](https://github.com/Fei-Away/Codex-Dream-Skin/tree/main)。

## 致谢

- [Codex-Dream-Skin](https://github.com/Fei-Away/Codex-Dream-Skin/tree/main)
- [Naptie/endfield-docmaker](https://github.com/Naptie/endfield-docmaker)
