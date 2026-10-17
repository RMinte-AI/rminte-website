# 案例演示服务

为官网各案例提供私有静态演示。官网的 `services/case-access` 网关负责登录及权限校验，此服务只提供资源，不管理账户。禁止为此 Worker 开启公开 workers.dev、预览地址或公开路由。

## 目录职责

```text
case-demos/
  worker.mjs                  共享资源服务，仅响应 /<case-id>/public/ 下的资源
  wrangler.jsonc              共享部署配置
  cases/
    <case-id>/
      README.md               此案例的说明、接入与使用方式
      public/                 HTML、CSS、脚本、模型与素材
      tests/                  此案例的集成测试
  tests/                      共享服务的测试
```

每个案例的名称、内容、使用方式和限制写在各自 README，不写入本目录说明或全站设计规范。开发过程及本地验收结果记录在 PR/CI artifact，不作为永久源码文档。

## 接入一个案例

1. 在 `cases/<case-id>/public/` 放置演示文件，引用使用相对路径。脚本模块使用 `.mjs`，普通浏览器脚本使用 `.js`。
2. 在 `services/case-access/resources.mjs` 注册该案例的 `demoPath: '/<case-id>/public/'`。只提供给已授权账户的入口应通过此网关，不使用公开旁路 URL。
3. 若需在案例页弹层展示，在 `website/cases/cases.js` 对应案例项中声明 `demo` 入口，例如 `demo: 'index.html?embed=1'`。没有此声明的案例沿用页面跳转。
4. 子页面按需发送 `case-demo-height` 消息调整 iframe 高度，发送 `case-demo-close` 关闭外层；父页面校验同源及消息来源。

## 部署

在官网仓库根目录执行：

```sh
npx wrangler@4.151.0 deploy --config services/case-demos/wrangler.jsonc
```

为官网 Pages 生产环境配置 Service Binding `CASE_DEMOS` → `rminte-case-demos`。保留现有 `CASE_DB`、`CASE_SECRET` 及 `/api/*` 路由；账户与密钥由生产环境管理。先部署私有资源服务，再通过官网原有流程发布入口。

## 本地联调

按 [账号服务说明](../case-access/README.md) 准备本地测试库，在两个终端分别运行：

```sh
npx wrangler@4.151.0 dev --config services/case-demos/wrangler.jsonc --port 8789 --inspector-port 9231 --ip 127.0.0.1
npx wrangler@4.151.0 dev --config services/case-access/wrangler.jsonc --port 8788 --ip 127.0.0.1
```

访问 `http://127.0.0.1:8788/cases/`。纯静态预览不模拟账号及权限。各案例的测试命令见其 README。
