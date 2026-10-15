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

新增或删除的 HTML 路由也进入浏览器范围。新增页面的 Base 应真实返回 404／410，或记录既有重定向及其可达目标；Head 应正常运行并产生截图。删除页面反向验证，并扩大检查以发现残留链接，不为不存在的页面伪造截图。新功能仍需提供针对实际操作的测试；通用页面加载检查不代替业务验收。

案例页检查实际登录提交、错误密码、演示与下载权限分别变化，以及退出后的拒绝访问。Worker 改动按实际配置编译：主站使用 Pages 构建，独立 OTA Worker 使用部署 dry-run，均不发布服务。JSONC、入口或静态目录错误应使验证失败。

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

修改门禁设施时，CI 另外执行 `npm run test:counterexamples`：在不发布的临时 Git 检出中，分别制造登录失败、新页面运行错误、Worker 入口缺失和合成密钥，并要求对应检查拒绝它们；同范围的正常版本必须通过。可在 `npm run verify` 后本地执行该命令，结果见 `output/ci/counterexamples.json`。普通业务改动不重复执行整组反例。

当前工作流和验证代码仍位于被审查的仓库内，绑定 GitHub Actions 来源不能单独证明执行定义没有被 PR 改写。Owner 需特别审阅工作流、依赖、检查与测试规则的变更；当前未配置组织级固定工作流规则或独立检查 App。根目录 `AGENTS.md` 的 `Code Review Rules` 同时指导已配置的 Codex 自动审查。

## 范围及发布

视觉修改不自动授权改产品规格、承诺、文案、下载材料或独立服务。保留既有工作区，不把他人的未完成修改、私有凭据、草稿和验证材料混入 PR。工作流、测试、规范和 CODEOWNERS 本身也由 Owner 负责。

生产站部署目录为 `website/`，Pages 项目为 `rminte-website`。主站合并授权不等于发布独立 OTA 服务，不允许在 PR 验证中写入生产 D1 或 R2。
