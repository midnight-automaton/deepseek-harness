# DeepSeek Harness

[English](README.md) | 中文

**让人在智能体工作中始终握有方向盘。**

这是基于 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的独立版本，重点打磨桌面交互：让智能体的工作可见、操作可控、会话可回看。原项目由 DeepSeek AI 创建，本仓库独立维护。

它构建于**一切皆插件**的架构之上，由 [Cordis](https://github.com/cordiverse/cordis) 驱动，其设计参见论文 [_A Programming Paradigm for Spatiotemporal Composability_](https://arxiv.org/abs/2608.25512)。

插件架构依然是基础。界面增加了近期消息编辑、受支持模型的思考强度调节、会话摘要、永久删除会话，以及子智能体的运行进度展示。

## 桌面体验

| 调整对话 | 查看委派工作 |
| --- | --- |
| ![编辑近期消息](docs/user/guide/github-message-edit.png) | ![查看运行中的子智能体](docs/user/guide/github-subagent-current.png) |
| ![调整思考强度](docs/user/guide/github-reasoning-slider.png) | ![确认会话删除](docs/user/guide/github-session-delete-confirm-clean.png) |

截图来自当前桌面开发版。底层 Harness 功能详见[用户指南](docs/user/index.zh.md)。

## 开发者预览

本版本处于 _开发者预览_ 阶段，可能出现破坏兼容性的变更。

运行本项目前，请阅读[安全说明](SAFETY.zh.md)。

<a id="run"></a>

## 运行

<a id="run-from-source"></a>

### 从源码启动桌面版

安装受支持版本的 Node.js 和通过 Corepack 启用的 pnpm，然后运行：

```sh
git clone https://github.com/midnight-automaton/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build:artifacts
pnpm run start:desktop
```

`start:desktop` 启动开发版应用，不生成安装包。如需 Web UI，可在构建产物后运行 `pnpm dsh web`，再阅读 [Web UI 指南](docs/user/guide/index.zh.md)。npm 上的 `@deepseek-ai/dsh` 属于原项目，不包含本版本的桌面改动。

## 社区与支持

- 在本仓库的 [Issues](https://github.com/midnight-automaton/deepseek-harness/issues) 报告问题或提出改进。
- 原项目及其社区见 [DeepSeek 官方仓库](https://github.com/deepseek-ai/deepseek-harness)。

## 参与贡献

欢迎提交 Issue 和 PR，详见[贡献指南](CONTRIBUTING.zh.md)。

## 开发

请先阅读[开发指南](docs/development.zh.md)与[架构文档](docs/architecture.zh.md)。

`pnpm run dev:web` 会在一个终端里完成构建、启动，并在源码修改时重建 client bundle；`make help` 列出 Web 与 Desktop 对应的 Make target。完整表格见开发指南的「应用命令」一节。

面向 agent：请遵循 [AGENTS.md](AGENTS.md)。

## 引用

```bibtex
@misc{deepseek-harness2026,
  title={DeepSeek Harness: Everything is a Plugin},
  author={DeepSeek-AI},
  year={2026},
  publisher={GitHub},
  howpublished={\url{https://github.com/deepseek-ai/deepseek-harness}},
}
```

## 许可证

[MIT](LICENSE)

第三方依赖及其许可证见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
