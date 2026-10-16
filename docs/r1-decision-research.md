# R1 工程与测试决策核查

核查日期：2026-10-16。范围：GitHub Pages / Actions 发布顺序、权限、恢复，Astro / pnpm 版本与草稿附件边界。Astro 文档先经 Context7 `/withastro/docs` 检索，再对安装要求读取官网；其余依据对应项目的官方文档。

本文是研究证据与工程判断，不是配置、安装、构建、部署或测试通过记录。主规范见 [工程与测试文档](../blog-r1-engineering-and-testing-proposal.md) 与 [实施清单](../blog-r1-implementation-and-acceptance.md)；本文的工程建议只有经主规范采纳后才成为项目决定。

## 1. 发布顺序必须有可执行定义

**事实：** GitHub concurrency 只保证同组同时至多一个运行任务；默认仅保留一个 pending，后来的 pending 替换前一个。当前还支持 `queue: max`，但 FIFO 依据进入等待的时间，不是提交时间。因此不能把任何一种队列设置写成“自动按源码提交顺序部署”。[GitHub concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)

**工程建议：** R1 仅保留一条生产入口，部署 job 使用固定组名 `pages-production`、`cancel-in-progress: false`，采用默认单 pending，不加入多版本排队功能。所有生产部署及其只读冒烟都在同一 job 的锁内完成；并行构建可以保留。

部署 job 获锁后立即从 GitHub 读取当前 `refs/heads/main`，要求候选源码 SHA 等于读取值；不等则记录 `superseded` 并禁止调用发布 Action，查询失败则失败关闭。`quality` 的通过与候选被取代分别记录，不能把“未部署”记成“上线成功”。禁止 force push 主分支；历史 run 重跑仍受同一检查。

**推断：** 若所有发布均经过该锁且主分支不能倒退，新候选 B 发布后，旧候选 A 即使更晚完成构建，也会在获锁后的 main 检查中被拒绝。依据是上述互斥机制、非倒退分支及候选一致性检查。若 A 已获锁并检查通过后 B 才合入，允许 A 完成后再由 B 发布；这不等于旧版本覆盖已经发布的新版本，也不保证正在部署的版本永远等于瞬时最新 main。

**未验证：** Q-T25 / R1-06-T18 需真实制造 A 构建慢于 B、A 先获锁后 B 合入、旧 run 重跑三种顺序，记录部署调用和线上 build identity；静态 YAML 检查不能替代此演练。

## 2. 生产权限与同一产物

**事实：** Pages 部署需要部署 job 的 `pages: write`、`id-token: write`、构建依赖及受保护 environment；默认名为 `github-pages`。`deploy-pages` 发布已上传的产物，并利用 OIDC 中的来源信息验证发布资格。[GitHub Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)、[deploy-pages](https://github.com/actions/deploy-pages)

**工程建议：** 工作流默认 `contents: read`，PR 只执行质量检查；生产 job 仅接受本仓库 `push` 到 `refs/heads/main`，单独授予 Pages/OIDC 写权限，并将 `github-pages` 的允许部署分支限制为 main。读取 main 所需权限保留在部署 job。不建立 PR 生产权限或另一个自动重建入口。

正式构建标识在产物检查前写入；产物检查与 E2E 后计算目录文件清单及 SHA-256，清单保存在站点输出之外。上传相同目录，不再重建。记录源码 SHA、run ID、run attempt、artifact ID、deployment ID 和目录摘要；归档文件摘要与目录内容摘要分别命名，不能默认二者相同。

**未验证：** Q-T24 / R1-06-T16 需在实际仓库检查 PR、非 main 来源、environment 规则与最小权限；Q-T29 / R1-06-T17 需核对检查、上传及发布记录，不得以 workflow 存在代替运行证据。

## 3. 恢复路径应与过时拒绝规则一致

**事实：** `upload-pages-artifact` 当前文档的默认保留期为 1 天。GitHub 重跑 workflow 仍使用原事件的 SHA / ref，且重跑功能有时间限制。[upload-pages-artifact](https://github.com/actions/upload-pages-artifact)、[重跑 workflow](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/re-run-workflows-and-jobs)

**推断：** “随时重跑旧 run 即可恢复”既不保证产物仍存在，也与“只接受当前 main SHA”冲突。依据是产物期限、旧 run SHA 不变和第 1 节的候选检查。

**工程建议：** R1 只实现源码恢复：从上一已验证版本提取需要恢复的内容，经 revert / 修复 PR 形成新的 main 提交，重新执行全套验证并部署新产物。审查已撤回内容，禁止盲目整站恢复使其重新发布。此流程恢复的是已验证的可观察内容与行为，不承诺重建字节与历史产物完全一致。

部署后冒烟失败应标记为发布失败，由维护者立即走上述恢复流程；不承诺平台自动回滚或失败发生前的网站从未变化。R1 不实现绕过 main 检查的旧产物紧急发布入口。若以后需要该能力，应另设已审核的恢复来源、授权、并发锁和 main 修复流程。

主工程文档现已确定测试报告、截图和 trace 保留 30 天，Pages 发布包保留 7 天，并在验收记录中保留长期可读的摘要、身份和结果；运行链接与 artifact 不是永久档案。这两个期限是项目策略，不是官方默认值。

**未验证：** Q-T27 / R1-08 的恢复演练尚未执行；不存在可在此时宣称“已跑通”的 runbook。

## 4. 版本必须区分当前文档、选择规则与验证结果

**事实：** 核查时 Astro 安装页要求 Node.js `22.22.0` 或更高且不支持奇数主版本。pnpm 安装页明确当前发布线为 12；pnpm 12 是原生可执行程序，经 npm 安装时安装器要求 Node.js 22.13 或更高。兼容表列出 Node.js 24。[Astro 安装](https://docs.astro.build/en/install-and-setup/)、[pnpm 安装与兼容表](https://pnpm.io/installation)

**工程建议：** Node.js 24 作为项目候选主线，Node 独立安装并由 `.node-version` 记录精确补丁；不同时启用 pnpm 的 Node runtime 管理。初始化时记录当日解析到的 Astro、pnpm 与插件精确版本，用真实干净安装、`astro check`、构建及各工具故障探针共同验证。通过后提交 `packageManager` 和唯一锁文件，后续 CI 使用精确版本与 frozen install，不在 CI 解析 `latest`。

**事实：** pnpm 当前配置参考将 `allowBuilds`、`strictDepBuilds` 等列在 `pnpm-workspace.yaml` 的设置中；其旧版本配置结构不能直接代表当前版。[pnpm 设置](https://pnpm.io/settings)

**未验证：** 本次没有安装项目或任何工具组合。Node 主线选择不证明 Astro、pnpm、lint 插件和浏览器测试包整体兼容；精确补丁与 Actions 完整 SHA 是初始化产生的机器可读输入，不应编造为已验证事实。版本选择机制可以现在确定，实际解析值和兼容性检查保留明确执行关口。

## 5. 草稿过滤与附件排除不是同一证据

**事实：** Astro 内容集合支持 `getCollection` 过滤草稿；官方示例也展示开发环境保留、生产环境排除的条件。`public/` 文件则直接复制进正式输出。[Astro 内容集合](https://docs.astro.build/en/guides/content-collections/)、[Astro imports](https://docs.astro.build/en/guides/imports/)

**已采纳的工程决定：** 项目使用严格的 `draft === false` 发布白名单，而不是照抄宽松的 `draft !== true` 示例；新文章模板默认写入 `draft: true`，schema 要求 draft 显式存在且为布尔值，缺失时校验失败，不由 schema 自动补值。首页和 `getStaticPaths` 共享发布集合。草稿专用资源禁止放入 public；开发 preview 只绑定本机。

**已解决的设计边界：** 主工程文档第 7.8.2 节已选择从 `content-assets/posts/<slug>/` 原样复制已发布文章实际引用的附件，不让其进入 Astro 自动导入或图片转换。原先“过滤路由是否足以避免附件输出”的框架行为假设不再作为实现前提。Q-T04 / R1-06-T10 仍必须用独立路由/资源清单、草稿唯一文本标记及全部输出文件的 SHA-256 检查边界；fixture 的草稿专用附件与共享附件使用不同字节。

原样复制与开发期本地附件处理器均为项目设计，不是 Astro 默认提供的行为。本次尚未执行构建，不能据此宣布附件隔离测试已经通过。

## 6. 研究后的决定收敛

| 类别                 | 事项                                                                                                                                                                      | 处理原则                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 用户已经决定         | 正式 `sionrbot/personal-blog`、验收 `sionrbot/personal-blog-acceptance`；GitHub Pages 项目地址，R1 无自定义域名；代码 MIT，文章、自有图片及文章内示例暂不额外授予复用许可 | 主工程文档第 2 节为唯一登记；远端实际存在性和权限仍未验证                         |
| 工程已经收敛         | 单生产入口、锁内过时检查、最小部署权限、同产物发布、源码恢复、版本冻结机制、附件原样复制和产物检查                                                                        | 主工程文档第 5、7.8、8、10 节为唯一规范；本研究中的建议不能被当作第二套可任选路线 |
| 必须实际执行才能确定 | 精确版本组合兼容、分支保护生效、并发发布拒绝旧候选、草稿附件排除、真实线上 404 和恢复结果                                                                                 | 记录用例、预期与关口；维持“未验证”，不能以决策已确定替代                          |

GitHub Pages 与自定义域名之间的路径合同仍应使用真实仓库标识计算：普通项目站点通常需要 `base: '/仓库名'`；所有站内链接必须包含 base。[Astro GitHub Pages 指南](https://docs.astro.build/en/guides/deploy/github/)
