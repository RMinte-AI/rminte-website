# 网站代码共建

PR 的目标仓库是组织上游 [`RMinte-AI/rminte-website`](https://github.com/RMinte-AI/rminte-website)，目标分支是 `main`。从最新主线开分支，一个 PR 解决一个明确问题。修改前阅读 [AGENTS.md](AGENTS.md)；界面改动遵循 [DESIGN.md](DESIGN.md)。

普通贡献者的 PR 需要 CI 通过和 Owner `massif-01` 批准。Owner 自己的 PR 不增加他人审批、AI 审查或强制审查材料，由 Owner 自行决定合并并保留原生绕过权限。Owner 合并到 `main` 即授权自动上线，不再分别批准部署和上线。

## 本地验证

需要 Node.js 22 或更高版本、Python 3、Git；使用 Linux、macOS 或 Windows WSL。首次安装：

```sh
npm ci
npx playwright install chromium
```

Linux 若缺少浏览器系统依赖，使用 `npx playwright install --with-deps chromium`。这只是测试工具，不会给网站增加运行时框架。

从仓库根目录执行：

```sh
npm run verify
```

默认与 `origin/main` 比较，并包含本地未提交的改动。若从个人 fork 检出，以组织上游为基线：

```sh
git remote add upstream https://github.com/RMinte-AI/rminte-website.git
git fetch upstream main
npm run verify -- --base=upstream/main
```

已有 `upstream` 时只需 fetch。完整验证门禁自身时可以执行 `npm run verify -- --all`；通常按实际改动范围检查即可。

`npm run evidence` 调用同一验证流程并重新生成必要证据。不要把两个命令连续运行当成两次不同验收。

验证结果在 `output/ci/report.md`。需要浏览器验证时，截图和过程记录在 `output/ci/playwright-report/index.html`，清单在 `output/ci/evidence/manifest.json`。这些材料不提交进源码仓库。`output/ci/runtime-*` 是临时本地数据库和测试凭据，验证结束自动移除，也不属于上传材料。

验证需要空闲的本地端口 8788 和 8789。它以实际 Pages 路由运行当前代码和 Base 代码，创建临时 D1 和测试账号，不使用生产密钥、数据库或 OTA 资源。报告中的 OTA 发布信息是明确标注的测试响应，不能当成设备或生产服务验收。

## 如何提交 PR

按 PR 模板填写四项：问题与原因、影响范围、验证结果、依据与限制。没有特殊依据或未验证项时可以写“无”，不要保留空字段或只有模板提示。小修改不要求另开 Issue。

CI 根据真实 Git 差异选择检查范围，不能靠标签将生产改动归为文档。非生产文档不要求网页截图；单页改动检查对应页面；共享字体、主题、布局和门禁设施扩大验证范围，具体矩阵见 AGENTS。

门禁自身的回归测试仅在门禁代码修改时运行，业务改动执行相应消费者的验证。非生产 Markdown 包括服务和门禁工具的 README，不触发运行时验证；生产指南 Markdown 仍按页面输入检查。单独修改 D1 运维配置不运行无关的页面截图；数据库迁移变动仍验证案例服务及页面。

范围识别分别记录受影响的 URL、源文件和配置消费者。HTML 文件新增、删除或移动后，Base 与 Head 都实际请求该 URL：HTTP 200 继续执行截图和交互检查，包括由 Worker 接管的页面；源文件不存在且 HTTP 确认移除或重定向时，才记录相应结果。报告核对每个仍存活页面的交互用例及前后证据。删除是否符合需求仍由 PR 说明和代码审查判断。

静态资源检查文件是否存在；内部页面导航检查本地 Pages 的真实 HTTP 结果，API 访问由相应权限流程验证。HTML 删除或移动时检查全站现存 HTML 的内部链接，截图和交互矩阵仍按受影响页面选择。外部链接及外部重定向目标不作可用性验收。新功能仍需提供实际操作的测试；通用页面加载检查不代替业务验收。

案例页验证从真实登录提交、授权按钮点击、资源请求到可见结果，再验证撤权和退出；未接入资源应明确显示不可用，不能以接口正常代替入口可用。配置检查按 `scripts/ci/config.mjs` 的实际消费者清单执行：主站使用 Pages 构建，独立 OTA Worker 使用部署 dry-run，D1 运维配置按文档中的绑定执行本地迁移，状态仅写入临时目录。变动的 JSONC 均进行语法检查；新增部署或运维入口时同步声明其消费者。前置输入或配置失败后，不再执行依赖它们的后续验证。这些命令均不发布服务或访问远端数据库。

每次验证都使用校验 SHA-256 的固定版本 Gitleaks 扫描 PR 提交和当前改动文件，报告只保留位置与规则，不输出密钥值；首次运行需要下载官方工具。密钥检查失败后停止后续验证。组织上游还启用了仓库级密钥扫描和推送保护。若凭据已经公开，删除当前文件不能撤回历史中的泄露，须撤销或轮换该凭据。

需要视觉证据时，CI 自动产生相同区域、语言、视口和状态的前后截图。首页还检查正常视频播放、滚动分解、宝石明暗和全部工艺步骤，保留过程证据。后台当前仅支持中文，报告如实标注；其他主站页面检查实际涉及的语言。

在 PR 的 Checks 中打开 `Website PR checks`，下载本次运行的 artifact：

- `report.md` 和 `report.json`：检查结果、不适用项和版本。
- `playwright-report/index.html`：测试步骤及图片附件。
- `evidence/manifest.json`：Base、Head、测试提交及截图校验信息。
- 各项 `.log`、`test-results/`：失败原因、必要的 trace 和录屏。

材料默认保留 30 天。新提交需要新的 CI 结果，旧 Head 截图不能替代当前证据。若材料过期，重新运行对应当前提交的检查。

## 如何处理失败

从报告指向的文件或测试操作复现并修复，再运行同一命令。中文缺字时，按 font checker 输出执行字体生成，并一并提交对应产物；不要手改生成文件。

检查失败、取消、意外跳过或必要证据缺失都会使 `pr-gate` 失败。删除测试、降低阈值、改变截图基线、修改 CI 或新增豁免时必须说明具体原因，由 Owner 判断是否合理。不要为了通过而删除必要验证。

作者负责解释关键改动及其依据。AI 生成说明、代码或自评都不能替代实际验证和 Owner 的合并决定。分别陈述本地、CI、测试数据、预览、正式上线和真实设备结果。

修改门禁设施时，CI 另外执行 `npm run test:counterexamples`：在不发布的临时 Git 检出中，验证同范围的正常版本能够通过，登录提交损坏、授权入口误拒绝、页面运行错误、路由迁移遗留死链、构建入口缺失、运维绑定错误及合成密钥分别被应负责的检查拒绝。HTML 移入 Worker 并保留 URL 的正常迁移也必须通过。一个正常版本可对应同范围的多个故障，不重复正常验证。可在 `npm run verify` 后本地执行该命令，结果见 `output/ci/counterexamples.json`。普通业务改动不重复执行整组反例。

当前工作流和验证代码仍位于被审查的仓库内，绑定 GitHub Actions 来源不能单独证明执行定义没有被 PR 改写。Owner 需特别审阅工作流、依赖、检查与测试规则的变更；当前未配置组织级固定工作流规则或独立检查 App。根目录 `AGENTS.md` 的 `Code Review Rules` 同时指导已配置的 Codex 自动审查。

## 范围及发布

视觉修改不自动授权改产品规格、承诺、文案、下载材料或独立服务。保留既有工作区，不把他人的未完成修改、私有凭据、草稿和验证材料混入 PR。工作流、测试、规范和 CODEOWNERS 本身也由 Owner 负责。

生产站部署目录为 `website/`，Pages 项目为 `rminte-website`。主站合并授权不等于发布独立 OTA 服务，不允许在 PR 验证中写入生产 D1 或 R2。
