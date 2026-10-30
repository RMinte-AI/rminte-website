# RM-01 官方只读知识 MCP（本地实现）

本服务在本机 Worker 运行时提供两个工具：`search_knowledge` 和 `read_section`。不调用模型，不访问官网业务 API，不读设备，也不绑定数据库或私有存储。

## 运行

在本目录执行，使用 Node.js 22.18+ 或 24.11+（本轮环境 24.10 能运行已测路径，但 npm 对部分上游可选工具链包给出了 engine 警告）：

```sh
npm ci --ignore-scripts
npm run build
npm run check
npm test
WRANGLER_SEND_METRICS=false npm run dev
```

`dev` 固定在 `127.0.0.1:8971`，使用 Wrangler `--local`。没有部署脚本、生产路由或资源绑定。若受沙箱限制而不能监听本机端口，需要该本地进程的执行许可。Wrangler 可能尝试获取本地模拟用的 `Request.cf` 示例信息；失败时会提示使用占位信息，本服务不使用该字段，不能把本地运行当作云端性能证明。

保持本地服务运行，在另一个终端执行：

```sh
npm run verify
```

使用真正的官方 MCP SDK 客户端连接本机 HTTP 服务。新版客户端显式固定 MCP `2026-07-28`，旧版客户端协商 `2025-11-25`；检查实际协议头，不用 SDK 包版本代替协议证据。两个客户端都执行固定的 88 个查询、章节读取和哈希/来源校验。无需 Agent 应用或模型 API。

## 文件与数据

- `scripts/build.ts`：只构建来源清单登记、已批准类型的中英文件；检查原文哈希。OCR 不进入运行包；历史宣传册仅在明确的历史搜索中出现。
- `src/text.ts`：中英文规范化、少量术语同义词及中文分词后的二元组。Node 构建和 Worker 查询使用同一代码；本轮协议测试也检查了两种运行环境对固定问题的结果。
- `src/knowledge.ts`：BM25 搜索、语言优先、版本过滤、精确章节去重和只读章节返回。所有正文连同上下文分别附带哈希。
- `src/server.ts`：通过官方 SDK 注册两个工具及只读声明，校验参数和返回量。
- `src/worker.ts`：独立 MCP 路由、请求体上限、最小健康检查和非公开目录的 404。当前只允许本机 Host/Origin，部署前需要明确配置正式域名。
- `tests/questions.json`：检索实现前冻结的 44 道中英文配对问题；文件哈希写入每轮证据。
- `tests/corpus.test.ts`：来源漏行、表格/代码块边界、版本与历史过滤、上下文、哈希、确定性和大小等检查。
- `.generated/`：可重建、未跟踪的运行数据和构建报告。语料、索引、来源元数据共同决定 `corpus_revision`，不单独热换正文。

所有公开答案依据来自 `../../docs/official-knowledge/`。方案和验证记录不会作为企业事实索引。按完整章节的内容哈希去重搜索结果，保留原始重复正文以便审计；没有为了减少重复而删除原文行。

## 接口

- `POST /mcp`：官方 MCP Streamable HTTP 协议处理。
- `GET /health`：服务版本与语料版本。
- 其他路径 404；`/connect` 尚未开发，官网入口也未改动。

搜索输入支持 `query`、`language`（auto/zh/en）、可选 `version`、`include_history` 和最多 8 个结果。搜索给出的 `section_id` 与 `corpus_revision` 用于读取。读取返回正文、继承上下文、原始 URL、来源页/行、适用范围、采集日期、已知原文日期及内容哈希。链接到中文权威合同的英文说明附有可读取的相关章节 ID。

未知或排除 ID 返回工具错误；语料版本变化要求重新搜索。没有任意 URL 读取、路径读取、执行命令或业务写入工具。没有生成答案的步骤；最终 Agent 能否正确引用、翻译及理解原文，需要在具体客户端和模型中另行验证。

## 证据与边界

[执行报告](../../docs/knowledge-mcp/IMPLEMENTATION.md)区分离线检索、本机协议验证、未做的应用兼容/云端验证。[原始运行记录](../../docs/knowledge-mcp/evidence/)保留检索失败与后续结果；每轮输出新文件，不覆盖旧记录。

固定问题集通过不代表任意自然语言问题都能命中。第一版是全文检索，不是语义模型。实时库存、最新发布、私有案例、客户事实和未发布企业资料不能从快照中推断。

官方依据：[Cloudflare Handler](https://developers.cloudflare.com/agents/model-context-protocol/apis/handler-api/)、[MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)。本地锁定版本见 `package-lock.json`。
