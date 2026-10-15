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

验证需要空闲的主站端口 8788、8789，演示 Worker 端口 8888、8889，以及对应的 8988、8989、9088、9089 调试端口。它以实际 Pages 路由运行当前代码和 Base 代码，创建临时 D1 和测试账号，不使用生产密钥、数据库或 OTA 资源。报告中的 OTA 发布信息是明确标注的测试响应，不能当成设备或生产服务验收。

## 如何提交 PR

按 PR 模板填写四项：问题与原因、影响范围、验证结果、依据与限制。没有特殊依据或未验证项时可以写“无”，不要保留空字段或只有模板提示。小修改不要求另开 Issue。

CI 根据真实 Git 差异选择检查范围，不能靠标签将生产改动归为文档。非生产文档不要求网页截图；单页改动检查对应页面；共享字体、主题、布局和门禁设施扩大验证范围，具体矩阵见 AGENTS。

门禁回归只在检查设施变动时运行。服务 README 等非生产 Markdown 不触发运行时；生产指南 Markdown 仍是页面输入。CI 不认识的新服务目录会明确失败，接入时应声明构建消费者和真实用户流程。

静态页面从 Base 与当前 Git 文件自动发现，原有页面定义只补充交互类型及截图区域。由 Worker 动态生成的公开 HTML 在 `tests/browser/worker-pages.json` 登记，例如 `{"path":"/example/","dependencies":["services/case-access/example.mjs"]}`。目录依赖以 `/` 结尾。清单和输入变动、共享样式变动都选择相应页面；字体构建和检查也读取这些输入。清单不提供语言豁免。独立 `website/tianshanos-demo/` 保留原有直接改动范围。

页面源文件与 URL 分开判断：Base、Head 都请求实际 Pages 路由。Head 仍声明为页面的入口必须直接返回 HTTP 200，并提供截图及交互结果；Base 的真实重定向、已移除入口的 404／410 或有效重定向只记录 HTTP 状态，不截取目标页冒充原页。仍声明存在却返回 404、撤回声明却仍返回 HTML、导航发现未登记的 Worker HTML，均失败。源文件或声明移除时检查全站残留链接。图片、脚本和样式按各自部署根检查文件；内部导航不猜文件后缀，统一验证 HTTP。重定向只跟随本地同源，跨站后记录 Location，不请求外站。通用加载检查不能代替新功能的业务验收；无链接且未登记的任意计算 URL 仍需代码审查发现。

案例演示是使用模拟数据的前端网页。每个案例在 `services/case-demos/assets/<case-id>/` 放置 HTML、CSS、JavaScript 和素材，通过现有 `services/case-access/resources.mjs` 接入官网演示按钮，沿用现有授权。网页打开后须能完成主要点击流程并看到预期模拟结果。为该案例添加 `tests/browser/demos/<case-id>.mjs`，默认导出普通 Playwright 操作函数 `async ({page,frame,caseName}) => { ... }`；`caseName` 是点击前的官网卡片名称；`frame` 是实际演示文档，可以是整页或 iframe。函数先核对案例名称及页面初始状态，再操作并断言可见结果。CI 沿用实际打开方式，返回案例页或关闭弹层后再进入一次，验证重新进入仍可用。具体业务操作只属于各自的案例，不写入通用 CI。

演示目录、官网案例入口或公共授权代码有改动时，CI 检查全部已接入演示。接入配置、演示目录及对应操作脚本必须齐全；从官网逐个点击并核对接入列表，防止只验旧案例。公共检查覆盖资源加载、运行错误、资源鉴权、独立下载权限、返回与重开，以及中英文外层和桌面／手机；弹层额外检查关闭卸载及焦点返回；未接入案例明确显示不可用。CI 使用隔离的本地 Pages、私有 Worker、临时 D1 和账号，演示资源保持私有。

登记资料下载时，在 Pages 配置声明 `CASE_FILES` R2 绑定，并在 `services/case-access/tests/files/<fileKey>` 提供合成文件。CI 将它写入独立的本地 R2，验证未登录、未授权、授权后返回的字节与提供的样本一致，以及文件名、缓存头和撤权；缺少文件不会按登记 key 自动伪造对象。此验证覆盖下载协议，不证明生产 R2 文件已存在，也不改变当前资料按钮的占位行为。

配置按实际消费者执行：Pages 构建 advanced-mode `_worker.js`，私有演示及独立 OTA Worker 执行部署 dry-run，D1 运维配置执行本地迁移；新增配置入口同步声明消费者。JSONC 统一解析；前置输入或构建失败后停止依赖阶段。这些检查不发布服务、不访问生产数据库。门禁修改需提供同范围正常版本和实际故障的验证证据，避免只测试辅助函数或重复跑整套 CI。

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

当前工作流和验证代码仍位于被审查的仓库内，绑定 GitHub Actions 来源不能单独证明执行定义没有被 PR 改写。Owner 需特别审阅工作流、依赖、检查与测试规则的变更；当前未配置组织级固定工作流规则或独立检查 App。根目录 `AGENTS.md` 的 `Code Review Rules` 同时指导已配置的 Codex 自动审查。

## 范围及发布

视觉修改不自动授权改产品规格、承诺、文案、下载材料或独立服务。保留既有工作区，不把他人的未完成修改、私有凭据、草稿和验证材料混入 PR。工作流、测试、规范和 CODEOWNERS 本身也由 Owner 负责。

生产站部署目录为 `website/`，Pages 项目为 `rminte-website`。主站合并授权不等于发布独立 OTA 服务，不允许在 PR 验证中写入生产 D1 或 R2。
