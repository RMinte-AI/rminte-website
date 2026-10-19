# 案例账号后台

案例访问服务；本地配置使用占位数据库，生产数据库见 `production.jsonc`，网站继续部署到现有 Pages 项目。正式站点源码在 `website/cases/`、`website/admin/`；旧 `design-preview/cases/` 仍是独立静态讨论稿。

## 架构和费用

保持现有 Cloudflare Pages，扩展其 `_worker.js`，将 `/api/*` 纳入 `_routes.json`。使用 D1（SQLite）保存账号、会话、成功登录记录、软件合作伙伴申请和接口限流计数。静态页面无需逐次运行 Worker。无需外部数据库服务或常驻服务器。

官方文档于 2026-09-26 核对：D1 Free 每天 500 万行读取、10 万行写入、总计 5GB 存储；Workers Free 动态请求每天 10 万次、每次 10ms CPU。免费额度为账户共享资源，实际占用需部署前核对。不能将本地测试当成生产 CPU 和流量验收；超出免费额度会影响可用性，不保证任何访问量都永久免费。

- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/pages/functions/bindings/

## 账号与权限

- 用户名：`rminte-` + 10 位随机小写字母/数字。
- 密码：12 位大小写字母和数字，保证三类均存在。Web Crypto 安全随机数、拒绝采样。账号仅由管理员生成，没有自助注册或修改用户名/密码接口。
- 生成账号只产生凭据，两项权限固定为未授权；生成后在已分发账号列表中分别勾选。创建接口不接受提前授权。
- 管理员独立于用户权限，能使用演示和资料入口。普通用户的 `can_demo`、`can_download` 分别授权，对已登录会话即时生效。
- 分发密码按用户身份作为附加认证数据，用 AES-256-GCM 加密保存。验证使用独立 HKDF 子密钥的 HMAC-SHA256，适用于**仅允许系统随机生成的高熵密码**；管理员修改密码后，升级为每账号独立随机盐的 PBKDF2-SHA256（100,000 次迭代，先用服务端独立 HMAC 密钥加 pepper）；新密码至少 15 个字符。管理员密码不保存可解密副本。此路径需要单独验收生产 CPU 配额。
- `CASE_SECRET` 为随机 32 字节的 base64，由 Cloudflare Secret 管理，不存入 D1 或代码。验证和加密使用不同子密钥。丢失或直接更换主密钥会使既有密码失效；上线前需备份密钥，轮换需要专门迁移。
- 密码列表默认遮蔽，管理员可查看或复制。管理员密码本身不保存在可解密列表中。
- 登录 cookie 在 HTTPS 上为 `__Host-rminte_session; Secure; HttpOnly; SameSite=Strict; Path=/`；会话有效期 24 小时。D1 只保存会话令牌散列。退出删除对应会话；删除用户级联删除会话和登录记录。
- 变更请求必须同源；登录有 IP 和用户名双层频率限制。公开申请按 IP 限流。所有接口响应禁止缓存。

## 登录记录与申请

成功登录时取 Cloudflare 的 `CF-Connecting-IP` 和 `request.cf.country/region/city`，记录时间，并显示距今多少分钟。历史保留 90 天，在后续成功登录时清理过期记录。**只记录，不比较跨地区、不自动封禁。** 本地运行若没有边缘地区数据，显示“地区未知”；不伪造真实定位。

收件箱只接收软件合作伙伴申请，字段为姓名、公司、邮箱、合作构想、产品理解与开发经验，提供已读标记和分页。不会自动发邮件，也不会自动开通账号。数据以文本渲染，避免将申请内容执行为 HTML。

## 本地运行

所有命令从仓库根目录执行，使用 Wrangler 4.141.0：

```sh
CASE_ADMIN_PASSWORD="<管理员初始密码>" node services/case-access/bootstrap.mjs
npx wrangler@4.141.0 d1 migrations apply CASE_DB --local --config services/case-access/wrangler.jsonc
npx wrangler@4.141.0 d1 execute CASE_DB --local --config services/case-access/wrangler.jsonc --file services/case-access/.local/bootstrap.sql
npx wrangler@4.141.0 dev --config services/case-access/wrangler.jsonc --port 8788 --ip 127.0.0.1
```

- 案例：`http://127.0.0.1:8788/cases/`
- 后台：`http://127.0.0.1:8788/admin/`
- 本地管理员账号：`services/case-access/.local/admin-login.txt`。只用于本地，文件权限 0600，目录和密钥均已 gitignore。
- bootstrap 不能重复覆盖已有初始化文件；不要为重复运行而清除现有数据库。
- `node services/case-access/tests/integration.mjs`：要求本地服务已启动。建立并删除测试用户，会留下显式标注的本地测试合作申请。
- `tests/crypto.test.mjs`：独立密码格式、加密和绑定验证。

## 部署方式

`wrangler.jsonc` 是 **Workers 本地模拟配置**，数据库 ID 是本地占位符，不能直接执行 `wrangler deploy` 来替代现有 Pages。

正式上线步骤：

1. 核实当前 Pages 项目、账户套餐、D1 剩余额度，创建 `rminte-case-access` D1 数据库。保持 Preview 与 Production 数据隔离。
2. 在现有 Pages 的 Production 绑定中添加 `CASE_DB`（D1）和 `CASE_SECRET`（Secret）；记录真实数据库 ID。管理员用户名固定为 `admin`，初始密码通过私有环境变量 `CASE_ADMIN_PASSWORD` 注入；未提供时生成随机密码。指定密码使用加盐 PBKDF2 验证值，明文不写入仓库或静态站点。生产密钥独立于其他环境，不能复制既有本地测试数据库。
3. 对准确的远端 D1 应用 `migrations/0001.sql`，再导入与生产 `CASE_SECRET` 对应的管理员初始化 SQL。禁止将明文账号、`.dev.vars` 或 `.local` 放入 `website/`。
4. 从确定的仓库快照构建 Pages Worker。`website/_worker.js` 引用了仓库内的 `services/case-access/` 模块，打包必须在包含这些模块的快照里完成。可用 `wrangler pages functions build --build-output-directory website --outdir <临时输出目录>` 验证；发布包中放入打包后的 `_worker.js`，不能单独复制未打包的入口文件后丢掉其依赖。
5. 确认 `_routes.json` 包含 `/api/*`，保留 `/visitor-language.js`；将 Pages 的 Functions failure mode 设为 fail closed，避免配额耗尽时绕过动态保护。所有受限内容均放在私有服务/R2，不放进静态资源，所以即使静态回退也不能泄露资料。
6. 在生产域名实测管理员和用户流程、真实 IP 与地区、独立权限、退出和删除失效、D1 数据持久化、免费 Worker CPU 限制，再核对部署版本。

## 演示与下载接入契约

`resources.mjs` 是服务端唯一登记表。演示配置恰选一种：私有 `demoPath`（例如 `/<case-id>/public/`）加该目录内相对 `demoEntry`（例如 `index.html?embed=1`）；或固定 HTTPS `demoUrl`，不得含用户名/密码。入口越出本案例网关、两种来源同时存在或地址无效时明确返回 503。只有下载的条目可以不配演示。

`GET /api/resources/:caseId/preview` 要求 can_demo，返回 `{kind:'private'|'website',src}`。匿名 401，无权限 403，未接入/配置错误 503。私有演示缺 CASE_DEMOS 返回 503；网站不依赖该绑定。客户端不提交任意目标地址。网站分支不代理第三方内容，不逐次 HEAD 外站，不向其发送本站身份。

私有 `/api/resources/:caseId/demo/…` 仍逐个请求鉴权，内部 Service Binding 传入 X-RMinte-User / X-RMinte-Role；不复制到外站。私有 Worker 禁止 workers.dev、preview URL 与公开 routes，响应 private,no-store。`fileKey/fileName`、CASE_FILES R2 与 can_download 独立，不受演示权限替代。管理员语义保持。不迁移数据库，不新增 SSO 或公开旁路。私有 CAD 带入 PR #14 的 `rminte-case-demos` Worker，生产需先部署该私有服务并配置 Pages 的 CASE_DEMOS 绑定；外站预览无需这个 Worker。

大型预览、外站直接展示及私有演示 ready/close 协议见 [演示服务说明](../case-demos/README.md)。

本地 `npm run preview:ci` 使用临时 Pages 源码树、D1、私有 Worker 与合成 R2；测试资源位于 `tests/resources.json`，同一资源表被临时 Worker 和 integration.mjs 实际读取，不改正式卡片或生产登记。测试仅在本地目录中生成账号与密钥。`npm run verify -- --base=<main SHA>` 执行既有 integration 入口，额外启用缺私有绑定的独立本地 Pages 实例，验证网站依然可用。

## 验收边界

已做本地 workerd + D1 HTTP 集成与 Chrome 页面操作。尚未进行云端部署、真实 IP 定位、生产 CPU 配额、真实演示服务及下载资源的联调。后台仅中文，案例提供六种语言。

管理员在后台登录状态旁点击「修改密码」，验证当前密码后设置新密码。普通用户没有此入口，接口也拒绝普通用户。修改成功会撤销该管理员的全部会话；初始密码文件不会同步更新，之后应使用自己设置的新密码。

生产 D1 运维使用 `--config services/case-access/production.jsonc --remote`；该配置仅供数据库命令，不用于 `wrangler deploy`。Preview 不绑定生产 D1 或 CASE_SECRET；两种 Pages 环境均 fail closed。
