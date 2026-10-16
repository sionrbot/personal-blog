# R1 实际验收记录

执行日期：2026-10-16（Asia/Singapore）。**R1-00 与 R1-01 已通过对应验收；R1-02 已实现并通过下文 5 项本地内容验收；R1-03 至 R1-08 未实施、未验收。**本记录中的“通过”只覆盖下列编号，不表示网站已公开部署或完整 R1 已完成。

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

## R1-00 / R1-01 收尾时的问题与边界

- 本地沙箱曾阻止 macOS 浏览器所需 Mach IPC；取得运行时权限后，同一测试在真实 Chromium/WebKit 中通过。未将沙箱启动失败算作产品缺陷或通过。
- Astro 7 在代理环境会自动后台启动预览；测试改用 `--ignore-lock`、动态本机端口和 Playwright 进程管理，禁止复用残留服务。
- 首轮审阅移除了未使用的 esbuild 脚本授权，并明确直接稳定选型与上游预发行依赖的区别；后续冻结安装和全部检查已通过。
- `.tools/`、node_modules、dist、缓存、报告、环境文件被忽略。证据中的无关本机目录已替换，原始 CI 日志仍可通过运行链接核对。
- 仅有最小首页。当时文章 schema/路由、草稿与附件管线、404、完整 verify、生产部署、线上冒烟、实际 Chrome/Safari 阅读验收和更新/恢复演练均未实施，不能从本轮结果推断通过。
- 验收使用的长期摘要、JSON 和必要截图随 Git 保存；原始 CI 日志/报告有期限。源码后续变更需重新跑对应检查，本记录不承诺任意未来版本仍通过。

## R1-02：文章文件与元数据规则

事实：以 `721baf5e08966469827c40eb2bb7ef05f62771d5` 为起点，从干净 main 建立 `feat/r1-02-content-rules` 分支；任务为 [Issue 3](https://github.com/sionrbot/personal-blog/issues/3)。本阶段使用原有精确版本，新增直接依赖 `@astrojs/markdown-remark@7.3.2` 并更新唯一 pnpm 锁文件。PR 与 CI 的实际结果见本节末尾。

事实：用户提供《重读自由软件宣言：计算在谁的机器上》原稿，随后明确确认允许进入正式公开仓库、PR 及永久 Git 历史，接受所提字段且无附件。原稿位于 `src/content/posts/rereading-free-software-manifesto.md`，保持 `draft: true`、日期 `2026-10-16`。仅将首行 H1 移入 title 并补齐 Markdown 空行；保留 9 个 H2、40 个正文段落。正文主张未做事实核查，工程通过不代表文章事实通过。SHA-256、授权范围与正式输出清单见 [真实草稿记录](evidence/r1/r1-02-real-draft.json)。真实稿及其历史不复制到独立验收仓库。

### 实现与一手依据

`src/content.config.ts` 接入 Astro glob 与严格 schema；加载前检查整个文章目录，拒绝被 glob 忽略的额外文件、子目录、隐藏文件和符号链接，文件名直接产生固定 id，加载后保留唯一性防御。日期按公历数字规则校验，保留原 date-only 字符串，不使用 Date 做时区转换。未来日期不改变 draft 发布判定。模板包含必填 `draft: true`；未填字段的模板有意无法构建。

事实：通过 Context7 核对 [Astro 7 升级说明](https://docs.astro.build/en/guides/upgrade-to/v7/) 与 [Unified 处理器接口](https://docs.astro.build/en/reference/markdown-processors/unified/)，并核对本地 Astro 7.3.8 配置类型与 glob 源码。配置显式使用 `markdown.processor: unified({ remarkPlugins: ... })`；URL helper 与 remark 使用同一 base 添加规则。插件检查正文标题、原始 HTML 与输入 URL 写法，转换普通/引用式链接及本地图片。正式 HTML/片段/CSS/srcset 存在性和草稿目标检查、附件归属与复制仍留在后续阶段。

Astro glob 会记录渲染错误后继续，因此 loader 另检查每条记录确实有 rendered 结果，防止非法草稿正文只打印错误却构建成功。真实负例证明该防御生效。构建包装器调用锁定 Astro CLI；通过 `pnpm build` 进入时仍由项目 pnpm 严格检查依赖。临时副本复用只读依赖，独立保存内容、`.astro`、`.cache/astro`、`.cache/vite` 与 dist，不调用包管理器安装、不拷贝真实文章，finally 清理副本。

### 逐项结果

| 验收项               | 操作、预期与实际证据                                                                                                                                                                                                                                 | 结论 |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| R1-02-A01 元数据校验 | 合法合成文章与真实草稿加载成功；四字段缺失/类型错误、空白 title/description、未知键和 slug 覆盖分别导致真实构建失败，并定位目标文章与字段。                                                                                                          | 通过 |
| R1-02-A02 默认不公开 | 实际模板为 draft:true；未填写模板失败，填写后的合成模板成功；缺少 draft 与字符串 false 都被实际 schema 拒绝。                                                                                                                                        | 通过 |
| R1-02-A03 地址稳定   | 隔离合成 route 两次真实构建，只改 title，`dist/posts/leap-post/index.html` 和 `/personal-blog/posts/leap-post/` 不变，HTML title 更新。正式文章页尚未实现，此结果不冒充 R1-03。                                                                      | 通过 |
| R1-02-A04 边界数据   | 单元覆盖重复记录、命名与完整公历边界；真实构建拒绝非法扩展名、大小写、隐藏文件、子目录、文件及目录符号链接和错误日期。合法 2000/2024 闰日成功；UTC、Asia/Singapore、America/Los_Angeles 三个独立构建中 2024-02-29 原样输出，未来日期不触发定时发布。 | 通过 |
| R1-02-A05 真实管线   | 42 项构建集成测试实际执行 44 次构建：5 次预期成功、39 次预期失败；每个失败都断言预期文件/字段或正文诊断，不只断言退出码。                                                                                                                            | 通过 |

单元测试 118 项通过。构建明细见 [44 次构建原始结果](evidence/r1/r1-02-builds.json)，用例代码在 `tests/unit/`、`tests/integration/content.test.ts`，合成 fixture 位于 `tests/fixtures/content/`。重复 id 使用内存重复记录测试，没有伪造同名磁盘文件。生产源码中没有测试文章路由或 collection JSON 端点。

### 故障与修正记录

首轮 40 项集成测试中 4 项失败、36 项通过，见 [首轮日志](evidence/r1/r1-02-integration-first.log)：测试子进程继承了 Vitest 的默认 base，测试页面 helper 生成根路径；另一个断言误写了相对链接应命中的诊断。隔离子进程的 Vite 环境、按实际 HTML 的编码片段和正确诊断断言后，重跑 41 项通过（补充目录符号链接用例）。没有删除失败用例或降低非法输入标准。

第一次本地临时人工预览误经 pnpm 自动安装入口，生成了任务临时 store，使后续 lint 扫描到第三方 Markdown 而失败；清理该任务生成的忽略缓存后重新执行阶段门禁，没有扩大 lint 豁免。正式构建脚本现直接使用已安装 Astro CLI，避免测试副本发生安装。人工探针页首次缺少 charset 导致中文乱码；修正测试页面 UTF-8/viewport 后实际 Chrome/Safari 中正常。正式首页原有 charset 未受影响。

审阅发现一个 P2 问题：重复引用定义的校验采用最后一个定义，但 Markdown 渲染采用第一个定义，可能漏过远程图片。已改为首定义优先并增加真实构建回归。回归同时暴露 Astro 默认内容缓存在共享的 `node_modules/.astro` 中；现显式设置独立 `.cache/astro`，每次构建清理，避免旧渲染结果掩盖插件改动。修复后的目标回归通过；最终完整结果见本节证据。

### 真实浏览器补充与阶段边界

事实：在本地忽略副本中，用真实草稿和测试专用路由检查实际 Chrome 155.0.8059.82、Safari 27.0.1 的 Markdown 渲染。Chrome 页面 200% 缩放、两者在 100% 页面缩放下将 html font-size 从 16px 加倍到 32px，正文均继承 32px，截图无裁剪重叠，scrollWidth 等于 clientWidth。Safari 原生文字缩放相邻档位实际为 207.36%（33.177601px），如实记录而非精确 200%。Chrome Tab 到达有效“本文”链接。详见 [浏览器环境与尺寸](evidence/r1/r1-02-browser.json)、[Chrome 页面放大](evidence/r1/r1-02-chrome-200.png)、[Chrome 字号加倍](evidence/r1/r1-02-chrome-font-200.png)、[Safari 文字放大](evidence/r1/r1-02-safari-text-207.png)、[Safari 字号加倍](evidence/r1/r1-02-safari-font-200.png)。

此补充只验证本次处理器与真实正文，不是正式阅读设计或完整 R1-05 验收；Safari 键盘、320/768/1440 全矩阵及其他排版材料继续留待对应阶段。当前正式 build 只输出最小首页，无文章正文、Markdown 原稿或文章路由；这不替代 R1-06 完整草稿/附件隔离验收。未创建生产部署，未运行线上冒烟，也未把 R1-03 至 R1-08 勾选通过。本阶段实际本地写作检查步骤已记入 [操作记录](runbooks/publishing.md)。

### 最终阶段门禁与审阅

事实：`pnpm verify:bootstrap` 的格式、lint、类型、工具链故障探针、118 项单元、42 项集成、正式构建及 Chromium/WebKit 两项测试全部通过，见[完整本地日志](evidence/r1/r1-02-verify.log)。另以独立验收仓库 base 执行 4 次合成本地构建，全部成功，见[另一 base 的结果](evidence/r1/r1-02-acceptance-base.json)；未向独立验收仓库写入真实稿。Playwright 输出独立存入 `test-results/browser`，避免清理前一阶段的内容构建证据。

两轴审阅：Standards 硬性违反 0、需要修复的代码异味 0；Spec 初发现 1 项 P2，已修复并经独立真实构建复核关闭，残留 0。引用定义回归的[修复前](evidence/r1/r1-02-reference-before.log)与[修复后](evidence/r1/r1-02-reference-after.log)均保留。[PR #12](https://github.com/sionrbot/personal-blog/pull/12) 的 [CI 运行](https://github.com/sionrbot/personal-blog/actions/runs/38879428991) 已在实现提交 `38b7de9411ad16d165ce85be3f9a07af14c59112` 上通过 bootstrap 和 required quality；见 [CI 状态](evidence/r1/r1-02-ci.json)与[阶段门禁日志](evidence/r1/r1-02-ci-summary.log)。本次文档收尾仍须通过同一 PR 的最新 quality 后才普通 squash 合并。未部署。
