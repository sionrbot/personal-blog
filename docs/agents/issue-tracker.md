# Issue tracker: GitHub

本仓库的议题与规格记录在：
[sionrbot/personal-blog Issues](https://github.com/sionrbot/personal-blog/issues)

使用 `gh` CLI。每次操作显式指定 `--repo sionrbot/personal-blog`，
确保多远程仓库环境下的目标一致。

## 常用操作

以下命令中的占位符需替换为实际值。
多行正文先写入临时文件，再通过 `--body-file` 传入。

- 创建：`gh issue create --repo sionrbot/personal-blog --title "<title>" --body-file <file>`
- 读取：`gh issue view <number> --repo sionrbot/personal-blog --json number,title,body,labels,comments`
- 列表：`gh issue list --repo sionrbot/personal-blog --state open --limit 100 --json number,title,body,labels,assignees`
- 更新正文：`gh issue edit <number> --repo sionrbot/personal-blog --body-file <file>`
- 评论：`gh issue comment <number> --repo sionrbot/personal-blog --body-file <file>`
- 添加标签：`gh issue edit <number> --repo sionrbot/personal-blog --add-label "<label>"`
- 移除标签：`gh issue edit <number> --repo sionrbot/personal-blog --remove-label "<label>"`
- 关闭：`gh issue close <number> --repo sionrbot/personal-blog`

需要完整集合时，使用分页查询或提高列表上限，并检查是否截断。
分流标签的映射见 `docs/agents/triage-labels.md`。

## 技能指令的含义

- “Publish to the issue tracker”：创建 GitHub Issue。
- “Fetch the relevant ticket”：读取对应 Issue 及其评论。
- 创建前，检查是否存在同一任务的议题；已有议题时在其上继续工作。

## Pull requests as a triage surface

**PRs as a request surface: no.**

若以后改为 `yes`，使用 `gh pr` 对应操作读取、评论、标记和关闭 PR。
GitHub 的 Issue 与 PR 共用编号；编号含义不明确时，先确认对象类型。

## 父子议题与依赖

- 创建子议题：在创建命令中加入 `--parent <parent-number>`。
- 关联已有子议题：`gh issue edit <parent-number> --repo sionrbot/personal-blog --add-sub-issue <child-number>`。
- 添加阻塞关系：`gh issue edit <child-number> --repo sionrbot/personal-blog --add-blocked-by <blocker-number>`。

优先使用 GitHub 原生关系。若功能不可用：

- 父子关系：在父议题正文维护子议题任务列表，在子议题正文顶部写 `Part of #<parent-number>`。
- 阻塞关系：在被阻塞议题正文顶部写 `Blocked by: #<number>`。

只有所有阻塞议题均已关闭，任务才可视为解除阻塞。

## Wayfinding

使用 `/wayfinder` 时：

- Map 是带 `wayfinder:map` 标签的父议题，正文维护 Notes、Decisions-so-far 和 Fog。
- 工作项是 Map 的子议题，类型标签为 `wayfinder:research`、
  `wayfinder:prototype`、`wayfinder:grilling` 或 `wayfinder:task`。
- 选择工作项时，读取 Map 的完整子议题集合，按 Map 顺序选择首个开放、
  无开放阻塞项且无人认领的议题。
- 认领：`gh issue edit <number> --repo sionrbot/personal-blog --add-assignee @me`。
- 完成：评论记录结果与验证证据，关闭议题，并在 Map 的 Decisions-so-far 中添加摘要与链接。

Wayfinding 标签在实际使用该流程时按需建立。
