# 官网指南页 Agent 入口 · 本地实现

后续两处交互修复及复审验证见 [网页复审记录](WEBSITE_ENTRY_REVIEW.md)。

2026-10-30 开工前，实际 fetch 组织上游 `RMinte-AI/rminte-website:main`，并通过 GitHub API 核对最新提交。两者均为 `c9b0897aa87a7e22a0ab264f9007a131f43a1135`，与当前分支 HEAD 一致，无需更新提交即可开始。工作分支为 `feat/rm01-knowledge-mcp-plan`；保留已有未提交知识文档、MCP 服务及独立预览。

## 实现

- 正式源码 `website/guides/index.html`：搜索之后、角色指南之前增加通栏 Agent 卡片，沿用 admin 的卡片及点阵规格。点击整张卡片打开接入指令模态窗口。
- `website/assets/knowledge-entry.js`：只在指南入口页加载，处理复制、成功与拒绝提示、关闭、焦点及滚动恢复。直接使用 `RM_I18N.text`，没有另一套翻译机制。中文界面使用确认过的中文指令，其他界面使用英文指令，并设置对应的 textarea 语言。
- 新增入口的 11 组界面文案登记在既有翻译源清单中，日、韩、西、法翻译写入 `website/locales/`，使用既有生成器构建四个浏览器目录。六语言均包括入口、弹窗、复制成功及失败提示。
- 网络配置卡片增加同规格三节点拓扑点阵标识；同步处理手机端图标与标题间距、正文间距和底部箭头对齐。
- `guides.css` 的新规则限定在这两张入口卡片与模态窗口。四篇指南仅更新该样式文件的缓存版本；同步生成模板和输出。根目录与站内 `DESIGN.md` 记录已确认的位置和视觉规范。

## 验证

正式 `website/` 作为本地 HTTP 根目录运行，资源路径与部署目录一致。

- 六种界面语言 × 1440、768、390、320px，共 24 种状态：新增文案正确、卡片与角色列表同宽、与 admin 底色/圆角一致、图标 66px、页面无横向溢出、弹窗位于视口内。
- 实际浏览器剪贴板写入后读取，与完整中文/英文指令逐字比较；另模拟浏览器拒绝写入，确认显示失败而非成功。没有调用 Agent 或 MCP。
- 验证真实语言菜单切换、键盘打开、Escape、关闭按钮、点击遮罩、焦点与页面滚动恢复、减少动效，以及原指南搜索结果及跳转、网络卡片跳转。四篇正文均不匹配新入口样式选择器。
- 网络卡片调整后的六语言 × 768、390、320px 共 18 种状态：图标尺寸、标题/正文间隔和箭头右边距符合预期，无横向溢出。
- JavaScript 语法、HTML/CSS 解析及部署资源路径、生成指南和翻译目录一致性、中文字体子集、10 页共享页脚一致性及差异空白检查通过。

证据保留在仓库根目录 `output/playwright/knowledge-entry/`：`production-verification.json`、`production-network-verification.json`、`production-source-snapshot.json`、`production-card-*.png`、`production-dialog-*.png`、`production-network-*.png`。完整提取器还发现了既有演示文案的范围差异；本轮保持旧清单并仅增加本入口 11 组，未改动提取或验证规则，记录在 `translation-extraction-note.json`。这些本地输出不是生产依赖。

## 使用边界

代码尚未提交、推送或部署。MCP 服务未在本轮运行或修改。接入地址保留已确认的占位符，页面明确说明服务尚未开放，当前复制功能可用不代表可以连接正式 MCP。

[中文本地预览](http://127.0.0.1:8987/guides/?lang=zh#knowledgeEntryLink) · [English preview](http://127.0.0.1:8987/guides/?lang=en#knowledgeEntryLink)
