# 主站共享页脚

标准页脚和联系面板的 HTML 只维护在 `website/scripts/footer-template.mjs`。`footerPages` 是范围清单：

- 首页、图册、模型、案例、下载、指南入口。
- 管理、Root、安全和网络四篇指南。

后台没有标准页脚；灯板工具有独立署名和操作区；OTA、案例演示等独立服务不使用这份模板。

## 修改与生成

1. 在模板修改结构，文案继续使用 `website/assets/site-data.js`；样式使用 `website/assets/styles.css`，文案初始化和联系交互使用 `website/assets/footer.js`。
2. 执行 `npm run build:footer`。指南生成器直接调用模板，其余页面只替换 `shared-footer` 和 `shared-contact` 标记之间的生成区域。
3. 执行 `npm run check:footer`，核对生成一致性及页面覆盖；该命令也由 PR 验证流程执行。

生成结果随代码提交，部署目录仍为 `website/`；浏览器无需获取模板。首页页脚仍位于工艺场景中，不由生成器移动。模板的唯一路径参数是页面相对站点根目录的位置。

新增使用标准页脚的页面时，在 `footerPages` 登记并设置两个生成区域，加载现有页脚脚本。生成器遇到标记缺失、重复或顺序错误直接报错，不自动追加、猜测或修复。独立页脚不套用标准模板。
