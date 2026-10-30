# 首次发布 · 2026-10-30

已先提交实现，再部署独立只读 MCP Worker，最后更新官网入口中的真实地址。

- 正式 MCP：`https://mcp.rminte.com/mcp`。
- 健康接口：`https://mcp.rminte.com/health`，正式 HTTPS 返回 200。
- Worker：`rminte-official-knowledge-mcp`，版本 `3b25946b-0c7a-45d7-a3bd-0bd8dc50f304`。
- 语料版本：`bac55fbe1bc24dd0b09f328315e06d10e66a96da9ed3ad375fc49728759a116c`，与本地构建一致。
- 正式 MCP 路由响应无请求体 GET 为 405，符合该无状态入口的方法约束；没有运行 Agent 接入测试。
- 官网指令已替换正式地址，六语言提示同步更新。官网上线由本分支合并 main 后的 Cloudflare Git 构建完成，结果另行核实。

之前的本地实现、复审与证据文件保留为相应阶段记录，不表示当前服务仍未发布。提交前对四个原始控制台日志仅规范化末尾空白，未更改失败事实；原始文件另保留在本地 output 目录。未将本地预览或截图输出纳入发布源。
