# CAD 案例演示

`assets/industrial-modeling/` 是独立静态包：HTML、CSS、JavaScript、本地 Three.js 与许可文件。全部使用模拟数据和新制马赛克示意素材，不包含原图、生产模型、模型接口或凭据。支持选择问题、文字修改尺寸、逐步建模、版本回看与旋转半成品。没有真实 CAD 建模或 AI 推理。

官网沿用 TianshanOS 的「按钮 → 弹层 → 按需 iframe」呈现方式。案例页先经过现有登录与演示权限校验，再打开 `/api/resources/industrial-modeling/demo/index.html?embed=1`。每个资源仍由现有网关检查权限。关闭弹层卸载 iframe，释放三维渲染和计时器；再次打开从头体验。手机以全屏弹层展示，上下滚动查看模型与问答。演示内容目前为中文；外层案例标题与关闭按钮沿用官网语言设置。

## 本地联调

先按 `../case-access/README.md` 初始化本地数据库（不要覆盖已有初始化）。然后从仓库根分别在两个终端运行（本次 Wrangler 4.141.0 多配置同进程模式会使第二个服务的静态资源返回 500；分开进程后通过 service binding 联通）：

```sh
# 终端一
npx wrangler@4.141.0 dev --config services/case-demos/wrangler.jsonc --port 8789 --inspector-port 9231 --ip 127.0.0.1
# 终端二
npx wrangler@4.141.0 dev --config services/case-access/wrangler.jsonc --port 8788 --ip 127.0.0.1
# 服务就绪后另开终端验证
node services/case-access/tests/cad-demo.mjs
```

打开 `http://127.0.0.1:8788/cases/?lang=zh`，使用本地账号进入工业研发 → AI 汽车研发与工业建模 → 演示。纯静态预览 4174 无 D1/API，不能用于授权联调。

## 生产接入（尚未部署）

1. 部署这个私有 Worker，保持 `workers_dev: false`、`preview_urls: false`、空 routes。
2. 在官网 Pages 环境设置 Service Binding：`CASE_DEMOS` → `rminte-case-demos`。
3. 按原官网流程构建、部署 Pages；保留 D1、Secret 与 `/api/*` 路由。
4. 验证未登录、未授权、已授权及撤销权限后的页面和静态资源请求。

不要把受限演示复制进公开的 `website/`，也不要将 iframe 指向 localhost 或公开的旁路地址。生产发布需要对应授权；本次仅本地接入验证。

## 本次验收（2026-10-14，本地）

- 实际 D1 + 两个 Worker：匿名、未授权和撤销权限后的 HTML/JS/CSS/图纸资源均拒绝；已授权资源与 HEAD 返回成功；缺失文件返回 404；下载权限独立。
- 浏览器：从工业建模案例卡片登录后在原页打开弹层；选择 18 mm 方槽和 1 mm 倒角推进至 3/4 半成品；输入“方槽改为16毫米”生成第 4 版。
- 内层说明弹窗先响应 Escape，再次 Escape 关闭外层；关闭后 iframe 为 about:blank、背景滚动恢复、焦点返回原案例演示按钮；重开回到等待开始。
- 桌面与手机布局检查通过，手机无横向溢出；中文/英文外层标题及关闭按钮正常。演示内容仍为中文。
- JavaScript 语法、git diff 空白检查、官网中文字体子集检查通过；浏览器控制台无错误/警告。
- 本地截图在 `outputs/cad-demo-qa/`，不纳入生产包。未验收生产绑定、云端访问或生产部署。
