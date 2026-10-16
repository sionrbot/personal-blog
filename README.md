# Sion 的博客

记录开发过程中的学习、实践与思考。

当前实现范围为 **R1-00 / R1-01 的最小 Astro 静态项目与基础门禁，以及 R1-02 的文章集合、元数据与 Markdown 内容规则**。文章阅读页面、草稿预览、附件复制、完整发布门禁和公开部署将在后续阶段实现；本仓库目前没有生产部署 workflow。各项运行结果与验收状态见 [实际验收记录](docs/r1-acceptance.md)。

## 准备环境

精确 Node 版本以 [.node-version](.node-version) 为准，pnpm 版本以 [package.json](package.json) 的 `packageManager` 为准。直接依赖使用精确版本，解析结果由唯一的 `pnpm-lock.yaml` 固定。

macOS / Linux 需要系统自带的 POSIX shell、curl、tar，以及 shasum 或 sha256sum。下面的脚本下载官方 Node 发行包、核对官方 SHA-256，再用该 Node 的 npm 安装固定 pnpm，全部保存在本项目忽略的 `.tools/`，不修改全局工具或 shell 配置：

```sh
sh scripts/setup-toolchain.sh
export PATH="$PWD/.tools/node/bin:$PWD/.tools/pnpm/node_modules/.bin:$PATH"
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm exec playwright install --with-deps chromium webkit
```

Linux 的 Playwright 系统依赖安装可能要求系统包管理权限；GitHub 托管 runner 由 CI 完成该步骤。每次打开新终端时重新设置上述 PATH。项目不使用 pnpm 的 Node runtime 管理或 Corepack。

## 运行

```sh
pnpm dev
```

打开终端显示的本机地址；首页路径为 `/personal-blog/`，不要重复追加。默认只绑定 `127.0.0.1`；修改首页后浏览器会更新。停止服务按 Ctrl+C。

```sh
pnpm build
pnpm preview
```

构建入口清理 `dist/` 和 Astro/Vite 缓存后运行 Astro；内容集合加载时校验全部文章，包括草稿。preview 只预览构建结果，不能代替生产托管。当前仍只有最小首页；文章阅读页、完整产物校验、附件复制和发布构建标识将在对应阶段加入。

## 创建与检查文章

文章保存在 `src/content/posts/` 顶层，使用小写英文字母、数字和单个分隔连字符组成的 `.md` 文件名，例如 `why-this-blog.md`。去掉扩展名的文件名是固定标识；修改标题不应改文件名。该目录不接受子目录、隐藏文件、符号链接或其他文件类型。

从 [文章模板](templates/post.md) 复制新文件，填写且只填写 `title`、`description`、`pubDate`、`draft` 四个必填字段。标题和摘要是去除首尾空白后非空的字符串；日期是加引号的真实 `YYYY-MM-DD` 日期；`draft` 只接受布尔值，模板默认 `true`。模板留空字段必须填写完整才能通过检查，草稿同样不能跳过校验。

正文使用 Markdown，不重复写文章 H1，从 `##` 开始且不跳标题级别，不使用原始 HTML。填写完成后运行 `pnpm check`、`pnpm build`。完整本地操作及当前限制见 [文章操作记录](docs/runbooks/publishing.md)，文件、日期、正文链接和附件合同见 [工程规范第 7.8 节](blog-r1-engineering-and-testing-proposal.md#78-补齐的内容与执行合同)。

首篇真实草稿已由用户提供，并明确允许原稿进入公开仓库、PR 和 Git 历史；采用作者确认的字段，保持 `draft: true`，无附件。文章内容未经过事实核查；内容校验结果不证明文章主张真实。

## 检查

| 命令                      | 当前实际职责                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------ |
| `pnpm format`             | 显式写入格式修改，之后审查 diff                                                      |
| `pnpm format:check`       | 只检查 Prettier 格式，包括 Astro、Markdown、JSON/YAML                                |
| `pnpm lint`               | ESLint、Stylelint（含 Astro 内 CSS）、markdownlint                                   |
| `pnpm check`              | Astro / TypeScript 诊断                                                              |
| `pnpm test:toolchain`     | 临时副本中执行格式/lint 故障与修复探针、锁文件失配负例和解析器/Vitest 启动验证       |
| `pnpm test:unit`          | 内容元数据、日期、固定标识、发布判定与 URL 转换规则的单元测试                        |
| `pnpm test:integration`   | 隔离临时副本的真实内容加载与构建正负例检查                                           |
| `pnpm test:e2e:bootstrap` | 对已构建最小首页运行 Chromium / WebKit；不重建                                       |
| `pnpm verify:bootstrap`   | 顺序运行格式、lint、类型、工具探针、单元、构建集成、构建、双引擎检查；任一步失败停止 |

`verify:bootstrap` 已接入 R1-02 的单元与构建集成测试，仍不是 R1-06 的完整 `verify`。尚未实现的产物与线上冒烟命令没有成功占位脚本。Vitest 的启动探针不计作文章业务测试；首页引擎检查也不冒充文章阅读验证或实际 Chrome / Safari 人工验收。

格式、lint 故障样本仅在临时目录生成，不修改真实文章和源码。自动测试报告在 `playwright-report/`、`test-results/`；失败 CI 报告保留 30 天。实际结果见 [R1 验收记录](docs/r1-acceptance.md)。

## 工具安装规则

pnpm 配置见 [pnpm-workspace.yaml](pnpm-workspace.yaml)：严格 peer dependency 检查、执行前依赖有误即报错、24 小时发布年龄且禁止静默放宽。依赖构建脚本仅允许当前锁定的 `sharp@0.35.5`（Astro 所依赖的图像原生包初始化），未全局允许脚本。当前依赖树没有实际安装 esbuild，未授予它脚本权限。升级依赖与 Actions SHA 必须经 PR 及阶段门禁。

## 仓库与发布目标

- [正式仓库](https://github.com/sionrbot/personal-blog)：目标 Pages 路径 `/personal-blog/`。
- [独立验收仓库](https://github.com/sionrbot/personal-blog-acceptance)：只放可公开的合成内容，目标路径 `/personal-blog-acceptance/`。
- site 固定为 `https://sionrbot.github.io`，配置拒绝未知的 `GITHUB_REPOSITORY`；本地默认正式仓库路径。
- Pages 生产部署不属于当前 R1-02；正式上线由 R1-07 完成，不把仓库存在当成网站已上线。

## 文档与协作

- [实施清单与验收条件](blog-r1-implementation-and-acceptance.md)：范围、任务及验收定义。
- [工程与测试规范](blog-r1-engineering-and-testing-proposal.md)：唯一工程决定和测试方法。
- [贡献流程](CONTRIBUTING.md)：main、PR、squash、quality 和公开边界。
- [实际验收记录](docs/r1-acceptance.md)：运行结果、证据及限制。
- [文章操作记录](docs/runbooks/publishing.md)：当前可执行的本地创建与检查步骤，以及尚未实现的发布流程边界。

## 许可与公开边界

站点程序、样式、配置、测试代码及自制合成测试材料适用 [MIT](LICENSE)。真实文章、附件、自有图片、文章内示例以及工程说明文档不因代码使用 MIT 而获同样授权，范围见 [内容许可说明](CONTENT-LICENSE.md)。第三方材料沿用原许可。

公开仓库里的草稿原稿和历史也可以公开读取。`draft: true` 仅表示不进入网站，不能作为保密措施；私密材料不得进入仓库、PR、Issue 或日志。
