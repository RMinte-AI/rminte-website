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

## 生产自动部署

组织上游 `RMinte-AI/rminte-website:main` 同时驱动两个 Cloudflare Git 集成项目：

| 项目 | 发布内容 | 配置 |
| --- | --- | --- |
| Pages `rminte-website` | 官网 `website/`，包括案例入口与账号网关 | 生产分支 `main`，保留原有自动部署 |
| Worker `rminte-case-demos` | 全部案例的私有演示资源与共享资源服务 | 生产分支 `main`，仓库根目录 `/`，部署命令见下文 |

Worker 构建由 Cloudflare 按仓库 lockfile 自动安装依赖，部署命令使用已锁定的 Wrangler：

```sh
npx --no-install wrangler deploy --config services/case-demos/wrangler.jsonc
```

构建监视路径为 `*`，覆盖新增案例、共享服务和依赖变更；关闭分支预览构建。`workers_dev: false`、`preview_urls: false` 和空 routes 保持生效，只允许官网网关通过 Service Binding 调用。

Pages 生产环境保留 `CASE_DEMOS` → `rminte-case-demos` 绑定，以及既有 `CASE_DB`、`CASE_SECRET`。此绑定首次配置后需要一次新的 Pages 部署才能生效，以后更新同名 Worker 无需重复绑定。新增案例仍按上文登记资源、官网入口及相应验收流程，合并后自动更新，不逐个创建新服务或手动发布。

合并 `main` 即授权官网及案例演示自动上线，不增加部署审批。两个项目独立构建，分别核对当前提交的部署结果；主站成功不代表演示 Worker 成功。发布后从正式官网的已授权账号验证演示，不能把部署成功或本地测试当成生产交互通过。生产回退也应核对两个项目的版本及接口匹配；账号服务的初始化、迁移和发布验收见 [账号服务说明](../case-access/README.md#部署方式)。独立 OTA 不在此链路内。

需要人工恢复时，从确定的提交检出，在仓库根安装依赖后执行上面的部署命令；只在 Cloudflare 管理已有生产凭据，不把凭据写入仓库或 PR。Cloudflare Git 构建参数在平台管理，不由 PR 检查工作流发布服务。

## 本地联调

按 [账号服务说明](../case-access/README.md) 准备本地测试库，在两个终端分别运行：

```sh
npx wrangler@4.151.0 dev --config services/case-demos/wrangler.jsonc --port 8789 --inspector-port 9231 --ip 127.0.0.1
npx wrangler@4.151.0 dev --config services/case-access/wrangler.jsonc --port 8788 --ip 127.0.0.1
```

访问 `http://127.0.0.1:8788/cases/`。纯静态预览不模拟账号及权限。各案例的测试命令见其 README。
