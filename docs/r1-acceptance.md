# R1 实际验收记录

执行日期：2026-10-16（Asia/Singapore）。**R1-00 与 R1-01 已通过对应验收；R1-02 至 R1-08 未实施、未验收。**本记录中的“通过”只覆盖下列编号，不表示网站已公开部署或完整 R1 已完成。

## 身份、环境与证据基线

- 被验证源码：`1b2cfd228548b0e10c209b8a411de136d5b5dcff`，两个仓库的初始化提交。
- 任务：[R1-00 / Issue 1](https://github.com/sionrbot/personal-blog/issues/1)、[R1-01 / Issue 2](https://github.com/sionrbot/personal-blog/issues/2)；全部任务已纳入 [R1 milestone](https://github.com/sionrbot/personal-blog/milestone/1)。
- 正式仓库：[sionrbot/personal-blog](https://github.com/sionrbot/personal-blog)；独立验收仓库：[sionrbot/personal-blog-acceptance](https://github.com/sionrbot/personal-blog-acceptance)，均为 public，当前维护者 sionrbot 具备 admin 权限。
- 本地：macOS arm64；独立官方 Node 24.22.0、pnpm 12.11.2；浏览器引擎 Chromium 156.0.8078.4 / WebKit 27.2（Playwright 1.64.1）。这不是安装版 Chrome/Safari 的 R1-05 人工验收。
- CI：GitHub 托管 ubuntu-24.04，Node / pnpm 从项目同一机器配置读取；依赖用 frozen lockfile 安装，浏览器由同一锁定 Playwright 安装。
- [正式仓库初始化 CI：成功](https://github.com/sionrbot/personal-blog/actions/runs/38872346248)、[独立验收仓库初始化 CI：成功](https://github.com/sionrbot/personal-blog-acceptance/actions/runs/38872349278)。两者的 bootstrap 和 quality 均成功，分别验证各自 base。

## 精确版本与安装结果

事实：使用 `create-astro@5.3.0 --template minimal --no-install --no-git --yes` 在临时目录创建官方最小骨架，然后加入本项目配置；没有采用完整博客主题。Node 采用官方独立压缩发行包，经官方 SHASUMS256.txt 验证；未使用用户原有 pnpm 所管理的 Node。

| 工具                                             | 已验证版本               |
| ------------------------------------------------ | ------------------------ |
| Node                                             | 24.22.0                  |
| pnpm                                             | 12.11.2                  |
| Astro                                            | 7.3.8                    |
| TypeScript / @astrojs/check                      | 6.0.3 / 0.9.10           |
| ESLint / eslint-plugin-astro / typescript-eslint | 10.12.0 / 3.2.1 / 8.71.2 |
| Prettier / prettier-plugin-astro                 | 3.9.10 / 1.1.1           |
| Stylelint / stylelint-config-standard            | 17.16.0 / 40.0.0         |
| stylelint-config-html / postcss-html             | 2.0.0 / 2.0.0            |
| markdownlint-cli2                                | 0.23.3                   |
| Vitest / Playwright                              | 5.0.4 / 1.64.1           |
| parse5 / PostCSS                                 | 8.0.1 / 8.5.30           |

本表是本次验收快照；未来运行的唯一版本来源仍是 [.node-version](../.node-version)、[package.json](../package.json)、[pnpm-lock.yaml](../pnpm-lock.yaml)。完整直接依赖、模板命令及 Node 发行包摘要见 [版本证据](evidence/r1/toolchain-versions.json)。

选取过程没有把“最新”当作兼容：TypeScript 7 不满足检查插件的共同 peer 范围，采用 6.0.3；Astro 7.4.0 与 Vitest 5.0.5 在选取时尚未满 24 小时，最终采用 7.3.8 / 5.0.4，清除候选安装自动产生的发布年龄例外。最终配置开启 strictPeerDependencies、minimumReleaseAgeStrict 和 verifyDepsBeforeRun:error。仅允许 `sharp@0.35.5` 的安装脚本；esbuild 没有实际安装，已移除其脚本授权。

已记录的上游情况：锁文件包含 Astro 传递依赖 `get-tsconfig@5.0.0-beta.6`；项目直接选型均为稳定版本，没有未经验证覆盖上游依赖。Astro 7 默认 Markdown 处理器与旧版不同，R1-02 实现既定 remark URL 转换时需显式接入官方 Unified 处理器，此处没有伪称文章管线已经实现。

## 逐项结论

以下各项均基于上述源码与日期；对应命令、环境、预期、实际和证据列于表中。

| 验收项                 | 操作与预期                                            | 实际结果及证据                                                                                                                                                                                                                                                                         | 结论 |
| ---------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| R1-00-A01 决策可追溯   | D-01—D-18 有唯一决定，已实施与后续关口分开            | 规范、版本配置、R1 Issue、本文及后续阶段边界一致；没有把后续发布/内容测试记为已完成                                                                                                                                                                                                    | 通过 |
| R1-00-A02 公开边界     | 检查公开源码与网站输出的范围、许可和忽略规则          | LICENSE / CONTENT-LICENSE.md 明确代码 MIT 与内容例外；仓库内无私密草稿、凭据、依赖或构建目录；初始 dist 仅最小首页及其样式，不含工程文档或源码                                                                                                                                         | 通过 |
| R1-00-A03 实施入口     | 核对真实仓库标识、平台路径、维护位置及权限            | 两个 public 仓库已创建，sionrbot 为 admin；site/base 在 astro.config.mjs 中；两份根规范原位维护，[平台设置快照](evidence/r1/repository-settings.json)可查                                                                                                                              | 通过 |
| R1-01-A01 开发预览     | 干净副本启动 dev，修改首页文案，浏览器应自动更新      | 在隔离副本修改 src/site.ts 后 Chromium 无手动刷新显示唯一新文案；原项目未改变，临时副本已还原；见[开发结果](evidence/r1/development-result.json)、[修改前](evidence/r1/development-before.png)、[修改后](evidence/r1/development-after.png)                                            | 通过 |
| R1-01-A02 发布构建     | 清理输出后 build，preview 应打开首页并加载样式        | 本地、干净副本及两仓 CI 构建成功；Chromium/WebKit 均验证 200、H1/title/lang/canonical、描述、样式与刷新；见[构建页面](evidence/r1/built-homepage-chromium.png)                                                                                                                         | 通过 |
| R1-01-A03 可重复运行   | 从不含依赖和缓存的干净 Git 副本按 README 重建         | 单独 clone 初始化提交，重新运行 setup-toolchain.sh，并用独立空 store frozen install；再完整 verify:bootstrap；均退出 0，工作树保持干净，见[环境准备](evidence/r1/clean-setup.log)、[安装](evidence/r1/clean-install.log)、[检查](evidence/r1/clean-verify.log)                         | 通过 |
| R1-01-A04 版本与锁文件 | 本地和 CI 同源版本，manifest 不匹配必须失败           | 两仓 CI 实际输出 Node 24.22.0 / pnpm 12.11.2；隔离 manifest 修改后，frozen install 命中 ERR_PNPM_OUTDATED_LOCKFILE 并定位 Astro；见[本地日志](evidence/r1/bootstrap-local.log)、[正式 CI 摘要](evidence/r1/ci-main-summary.log)、[验收 CI 摘要](evidence/r1/ci-acceptance-summary.log) | 通过 |
| R1-01-A05 工具实际覆盖 | 六类文件注入格式/lint错误，必须报对应错误，修复后通过 | Astro 模板、TS、独立 CSS、Astro 内 CSS、文章 Markdown、工程 Markdown 各完成负例和修复；文章 frontmatter + H2 可通过；Vitest/parse5/PostCSS 启动协作通过，见 scripts/test-toolchain.mjs 与本地/CI日志                                                                                   | 通过 |
| R1-01-A06 协作门禁     | 实际失败 PR 必须被 quality 和 main 规则阻止合并       | 两仓各一个故障 PR 的 CSS property-no-unknown 失败、quality 失败；以 admin 账号走普通 squash merge API 均返回 HTTP 405；两个 main 保持初始化 SHA，详见下节                                                                                                                              | 通过 |

## 受控平台演练

事实：两仓均仅允许 squash，合并后自动删除分支；main 要求 quality、分支最新、PR、解决讨论及线性历史；审批人数 0，规则覆盖管理员，无日常绕过，禁止强推/删除。Actions 默认只读且不能批准 PR；Secrets scanning、push protection 和 Dependabot alerts 已启用，未开启自动依赖更新。日志/产物仓库保留期为 30 天。配置证据保存在 [repository-settings.json](evidence/r1/repository-settings.json)。

初始化例外只有一次：空仓库由 sionrbot 将 `1b2cfd2` 推到两个 main，建立首个实际 CI；随后立即启用保护（2026-10-16 16:14 左右，Asia/Singapore）。故障 PR 和后续验收记录全部经短分支/PR，不再直接推 main。

| 仓库     | 故障 PR 与 CI                                                                                                                                                  | 实际合并结果                                                                                          |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 正式     | [PR 10](https://github.com/sionrbot/personal-blog/pull/10)；[失败运行](https://github.com/sionrbot/personal-blog/actions/runs/38872498042)                     | HTTP 405，Required status check quality is failing；[原始响应](evidence/r1/merge-rejection-main.json) |
| 独立验收 | [PR 1](https://github.com/sionrbot/personal-blog-acceptance/pull/1)；[失败运行](https://github.com/sionrbot/personal-blog-acceptance/actions/runs/38872694772) | 同样 HTTP 405；[原始响应](evidence/r1/merge-rejection-acceptance.json)                                |

两个故障 PR 均已关闭且删除短分支，没有合入。故障提交为 `e6e3400f2084cb158df6a0bf562b336ad57b0351`；[正式 CI 失败摘要](evidence/r1/ci-failure-summary.log)确认错误来自预期 CSS 规则，而非依赖安装或权限故障。该演练证明当前普通 PR 合并门禁，不替代后续 R1-06 的所有取消/跳过/部署来源与并发演练。

## 已解决问题与剩余边界

- 本地沙箱曾阻止 macOS 浏览器所需 Mach IPC；取得运行时权限后，同一测试在真实 Chromium/WebKit 中通过。未将沙箱启动失败算作产品缺陷或通过。
- Astro 7 在代理环境会自动后台启动预览；测试改用 `--ignore-lock`、动态本机端口和 Playwright 进程管理，禁止复用残留服务。
- 首轮审阅移除了未使用的 esbuild 脚本授权，并明确直接稳定选型与上游预发行依赖的区别；后续冻结安装和全部检查已通过。
- `.tools/`、node_modules、dist、缓存、报告、环境文件被忽略。证据中的无关本机目录已替换，原始 CI 日志仍可通过运行链接核对。
- 仅有最小首页。文章 schema/路由、草稿与附件管线、404、完整 verify、生产部署、线上冒烟、实际 Chrome/Safari 阅读验收和更新/恢复演练均未实施，不能从本轮结果推断通过。
- 验收使用的长期摘要、JSON 和必要截图随 Git 保存；原始 CI 日志/报告有期限。源码后续变更需重新跑对应检查，本记录不承诺任意未来版本仍通过。
