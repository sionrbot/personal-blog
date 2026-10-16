# 参与与验证

本仓库按[实施清单与验收条件](blog-r1-implementation-and-acceptance.md)确定范围，按[工程与测试合同](blog-r1-engineering-and-testing-proposal.md)确定执行方法。本文提供协作入口，不复制决定表或测试矩阵，也不表示远端规则已经启用。

## 提交变更

从最新 `main` 建立聚焦单个变化的短分支，使用 `feat/`、`fix/`、`docs/`、`content/` 或 `chore/` 前缀。合并前与 `main` 同步，提交 PR 并完成维护者自审、必需的 `quality` 检查和全部讨论处理。单维护者流程不要求另一人批准，审批人数为 0；通过后 squash 合并并删除短分支。

禁止直接推送、强制推送或删除 `main`，管理员也无日常绕过入口。只有空仓库建立首个有效 CI 时允许一次记录完整的引导提交；具体边界和实际规则验证见[工程合同第 3 节](blog-r1-engineering-and-testing-proposal.md#3-仓库公开边界与协作)。

## 检查与证据

环境与启动步骤以 README 和机器版本配置为准。命令和文件覆盖按[工程合同第 6 节](blog-r1-engineering-and-testing-proposal.md#6-linterformatter-与其他工具链)执行；完整发布前门禁使用 `pnpm verify`。实施早期仅有阶段性检查时，必须注明实际覆盖范围，不能将缺失层级写成成功脚本或声称完整门禁已通过。

PR 应记录变更对应的任务、验收编号、实际执行命令和证据。涉及布局、正文渲染等变更时，按[第 7.8 节](blog-r1-engineering-and-testing-proposal.md#78-补齐的内容与执行合同)补做实际 Chrome / Safari 人工检查。未执行的项目写“未验证”；不适用的项目说明理由。不得通过删测试、扩大忽略范围、跳过失败或自动更新期望值掩盖问题。

规范与相关实现同时更新；改变范围或验收条件必须说明原因。Issue 管任务进度，实际结论和证据由 `docs/r1-acceptance.md` 统一索引。合并不自动表示验收完成：仍需线上检查的任务用 `Refs #...` 关联，验收结束后再关闭。详见[工程合同第 9 节](blog-r1-engineering-and-testing-proposal.md#9-文档issue-与-pr)。

## 文章、材料与许可

写作、URL、附件和草稿规则见[工程合同第 7.8 节](blog-r1-engineering-and-testing-proposal.md#78-补齐的内容与执行合同)。新增或修改文章沿用同一 PR 与检查流程；不为标点修订强制新建 Issue。

提交前阅读[代码与内容许可](CONTENT-LICENSE.md)，确认原稿、图片、引用和附件可公开且来源明确。不要提交凭据、私人环境转储或保密草稿；不要将 `public/` 当作草稿附件目录。公开仓库的 `draft: true` 不是访问控制。
