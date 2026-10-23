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
- 生成普通用户账号只产生凭据，案例权限为空；生成后在列表中选择案例。创建接口不接受角色或提前授权。
- 管理员独立于普通用户案例授权；完成首次改密后可使用全部案例。普通用户按 `case_grants` 授权，演示与下载同时开放，对现有会话后续请求生效。
- 分发密码按用户身份作为附加认证数据，用 AES-256-GCM 加密保存。验证使用独立 HKDF 子密钥的 HMAC-SHA256，适用于**仅允许系统随机生成的高熵密码**；管理员修改密码后，升级为每账号独立随机盐的 PBKDF2-SHA256（100,000 次迭代，先用服务端独立 HMAC 密钥加 pepper）；新密码至少 15 个字符。管理员密码不保存可解密副本。此路径需要单独验收生产 CPU 配额。
- `CASE_SECRET` 为随机 32 字节的 base64，由 Cloudflare Secret 管理，不存入 D1 或代码。验证和加密使用不同子密钥。丢失或直接更换主密钥会使既有密码失效；上线前需备份密钥，轮换需要专门迁移。
- 密码列表默认遮蔽，管理员可查看或复制。管理员密码本身不保存在可解密列表中。
- 登录 cookie 在 HTTPS 上为 `__Host-rminte_session; Secure; HttpOnly; SameSite=Strict; Path=/`；会话有效期 24 小时。D1 只保存会话令牌散列。退出删除对应会话；删除用户级联删除会话和登录记录。
- 变更请求必须同源；登录有 IP 和用户名双层频率限制。公开申请按 IP 限流。所有接口响应禁止缓存。

## 登录记录与申请

成功登录时取 Cloudflare 的 `CF-Connecting-IP` 和 `request.cf.country/region/city`，记录时间，并显示距今多少分钟。历史保留 90 天，在后续成功登录时清理过期记录。**只记录，不比较跨地区、不自动封禁。** 本地运行若没有边缘地区数据，显示“地区未知”；不伪造真实定位。

收件箱只接收软件合作伙伴申请，字段为姓名、公司、邮箱、合作构想、产品理解与开发经验，提供已读标记和分页。不会自动发邮件，也不会自动开通账号。数据以文本渲染，避免将申请内容执行为 HTML。

## 本地运行

所有命令从仓库根目录执行，使用仓库锁定的 Wrangler 版本：

```sh
CASE_ADMIN_PASSWORD="<管理员初始密码>" node services/case-access/bootstrap.mjs
npx wrangler d1 migrations apply CASE_DB --local --config services/case-access/wrangler.jsonc
npx wrangler d1 execute CASE_DB --local --config services/case-access/wrangler.jsonc --file services/case-access/.local/bootstrap.sql
npx wrangler dev --config services/case-access/wrangler.jsonc --port 8788 --ip 127.0.0.1
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
3. 新数据库对准确的远端 D1 应用全部 migrations，再导入与生产 `CASE_SECRET` 对应的管理员初始化 SQL；已有数据库必须按下文 0002 迁移流程处理，不得重新 bootstrap。禁止将明文账号、`.dev.vars` 或 `.local` 放入 `website/`。
4. 从确定的仓库快照构建 Pages Worker。`website/_worker.js` 引用了仓库内的 `services/case-access/` 模块，打包必须在包含这些模块的快照里完成。可用 `wrangler pages functions build --build-output-directory website --outdir <临时输出目录>` 验证；发布包中放入打包后的 `_worker.js`，不能单独复制未打包的入口文件后丢掉其依赖。
5. 确认 `_routes.json` 包含 `/api/*`，保留 `/visitor-language.js`；将 Pages 的 Functions failure mode 设为 fail closed，避免配额耗尽时绕过动态保护。所有受限内容均放在私有服务/R2，不放进静态资源，所以即使静态回退也不能泄露资料。
6. 在生产域名实测管理员和用户流程、真实 IP 与地区、逐案例权限、退出和删除失效、D1 数据持久化、免费 Worker CPU 限制，再核对部署版本。

## 演示与下载接入契约

当前未提供真实软件或资料，`resources.mjs` 留空，权限通过后返回 503“尚未接入”。这不是完成了真实软件单点登录的证明。

- 资料：私有 R2 bucket 绑定 `CASE_FILES`，禁用公开访问，按 `resources.mjs` 的固定对象 key 提供下载。严禁把机密文件放在 `website/` 或使用可绕过权限的公开链接。
- 演示：私有 Worker service binding `CASE_DEMOS`，禁用目标 Worker 的 workers.dev 和公开 routes。访问必须经本网站 `/api/resources/:caseId/demo/…`。网关每次检查当前账号及权限，然后通过内部请求传入 `X-RMinte-User` 和 `X-RMinte-Role`。不转发用户密码、会话 cookie 或浏览器自带身份头。
- 当前网关支持 GET/HEAD 页面与静态预设演示；资源地址必须使用该案例网关路径下的相对 URL。目标服务不能重定向到公开演示地址，不能输出依赖生产后端的访问凭据。
- 合作软件若需要 POST、WebSocket、上传等功能，需要按真实接口增加同源及权限校验后再接入；不得认为任意外部软件仅挂一个链接就能自动单点登录。
- R2/额外演示 Worker 的费用需按文件体积和软件调用量单独核实，不能混同于本后台 D1 免费额度。

## 验收边界

已做本地 workerd + D1 HTTP 集成与 Chrome 页面操作。尚未进行云端部署、真实 IP 定位、生产 CPU 配额、真实演示服务及下载资源的联调。后台仅中文，案例提供六种语言。

管理员在后台登录状态旁点击「修改密码」，验证当前密码后设置新密码。普通用户没有此入口，接口也拒绝普通用户。修改成功会撤销该管理员的全部会话；初始密码文件不会同步更新，之后应使用自己设置的新密码。

生产 D1 运维使用 `--config services/case-access/production.jsonc --remote`；该配置仅供数据库命令，不用于 `wrangler deploy`。Preview 不绑定生产 D1 或 CASE_SECRET；两种 Pages 环境均 fail closed。

## 账号与案例权限升级（0002）

本节描述待部署实现，不表示生产迁移已执行。`users.role` 仍为 `admin/user`，`is_owner=1` 标识唯一主管理员。仅该身份可调用 `/api/admin/admins`；普通管理员可管理所有普通用户，所有用户管理目标必须为 `role=user`。主管理员不能由接口创建、转让、停用或删除。

普通用户使用 `case_grants(user_id,case_id)`，一个案例授权同时开放演示和资料下载。共用的公开案例清单在 `website/assets/case-catalog.mjs`；私有服务与文件映射仍在服务端。`GET/PUT /api/admin/users/:id/cases` 读取／整体替换授权，PUT 提交 `{case_ids,version}`。并发版本冲突返回 409，所有写操作在同一 D1 batch 中按版本条件执行，不会部分覆盖。旧 PATCH 总开关接口已移除；旧字段仅为迁移核对保留，不参与新权限判断。

主管理员可通过 `POST /api/admin/admins` 创建普通管理员（仅接受可选 label），初始密码随机生成 24 位，仅返回一次，数据库不保存可解密副本；首次登录仅允许会话查询、退出及自己的密码修改。完成修改后所有会话撤销，重新登录后获得管理权限。`PATCH /api/admin/admins/:id` 仅接受 `{enabled:boolean}`，停用及启用都会撤销旧会话。普通用户的密码分发功能保持不变。管理员密码丢失时本次不提供找回／重置接口；Owner 可停用旧账号后分发独立账号。创建超时不自动重试，应先核对管理员列表。

权限变更、管理员创建和状态变化写入 `permission_events`，记录操作者、目标、变更及时间，不存密码／令牌。前端隐藏入口不是安全边界；每次请求读取有效会话和账号状态，演示子路径、HEAD 和资料下载都检查案例权限。撤权影响后续请求，不能回收已下载的文件。

### 迁移与切换

1. 在明确的发布授权下核实当前部署代码、数据库和备份。先在隔离数据库演练。启用账号服务维护窗口，阻断旧版本对账号及私有资源的读写；公开站点仍可访问。数据库迁移本身不能让仍运行的旧代码理解新规则。
2. 导出最小账号清单：`SELECT id,username,role,can_demo,can_download FROM users ORDER BY id;`，保存为 JSON 数组（不要包含密码字段）。明确核实唯一现有 `admin` 的 ID。存在额外管理员则停止自动迁移并核对。
3. 生成 SQL：`node services/case-access/upgrade.mjs inventory.json OWNER_ID upgrade.sql decisions.json`。decisions 可省略；单项旧权限必须提供明确的用户 ID 到案例 ID 数组映射。双开映射为当前所有案例，双关映射为空。不得静默扩大单项旧权限。
4. 在维护窗口中应用 0002 schema，再将生成的升级语句作为**一个原子数据库事务／D1 batch**执行；不能逐条独立提交。生成器只写文件，从不连接数据库。可在持有目标 D1 binding 的受控维护执行器中调用 `applyUpgrade(db, inventory, ownerId, decisions)`，该函数使用单次 D1 batch；不要逐条执行 SQL 文件。生成 SQL 对清单数量、角色、旧权限及未迁移状态做断言；任何不一致都中止。迁移撤销旧会话，完成后设置 `access_settings.ready=1`。
5. 部署当前代码，核对只有一个 Owner、各类账号与案例授权、备份和迁移版本。未 ready 的新服务对账号请求返回 503。完成新版本角色／撤权／登录验收后解除维护窗口。
6. 禁止回退到不识别 is_owner、disabled_at 或 case_grants 的旧代码。恢复版本必须保留新权限校验；如需数据恢复，单独评估备份之后新增的数据，不直接覆盖。

新环境先应用全部 migrations，再使用更新后的 bootstrap.sql；bootstrap 指定唯一 Owner 并启用新权限，不覆盖现有账号。生产账号迁移未在本次开发中执行。

### 新增验证

`node --test services/case-access/tests/*.test.mjs` 包含加密、SQLite 迁移事务、本地 D1 原子迁移与权限代理测试（Node 22.13+ 或 24）。资源测试使用明确的隔离演示／文件 fixture，不能证明真实私有服务可用。既有 `integration.mjs` 扩展了真实本地 Pages/D1 上的管理员与案例权限矩阵。浏览器 `account-permissions.spec.mjs` 覆盖创建、首次改密、跨管理员管理普通用户、授权保存、取消与停用，使用 CI 临时数据库和账号。
