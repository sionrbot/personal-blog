# Domain Docs

本仓库采用 single-context 领域文档布局。

## 探索前读取

- 根目录 `GLOSSARY.md`：项目领域术语及其定义。
- `docs/adr/`：与当前工作相关的架构决策记录。

这些文件尚不存在时，继续当前任务，不要求提前创建。
`domain-modeling` 技能在术语或决策实际明确后按需建立它们。

现有工程决定继续以 `blog-r1-engineering-and-testing-proposal.md` 为准，
任务范围与验收条件见 `blog-r1-implementation-and-acceptance.md`。
新增 ADR 涉及现有决定时，明确引用并协调相关规范。

## 布局

- `GLOSSARY.md`：全仓库共用的术语表。
- `docs/adr/NNNN-short-title.md`：按编号记录的架构决策。

## 使用统一术语

在议题标题、设计提案、假设和测试名称中使用术语表定义的名称。
遇到缺失概念时，先检查项目现有用语；确有术语缺口时，
记录为后续 `domain-modeling` 的输入。

## 显式指出决策冲突

提出与现有 ADR 或工程规范冲突的建议时，引用具体决策，
说明冲突和重新讨论的理由。区分已采纳决定与待评估建议。
