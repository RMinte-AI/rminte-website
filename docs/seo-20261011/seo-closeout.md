# PR #3 最小收尾

沿用 `seo/technical-20261011`，在原提交 `e91b3ed` 上追加提交，保持既有 SEO 方案。本次没有合并或执行生产部署。

## 修改文件

| 文件 | 变化 |
| --- | --- |
| `website/scripts/seo.mjs` | Organization.logo 改为已有 `assets/images/favicon.png`；512×512 黑底白色真实品牌图形，白底下可辨识 |
| `website/index.html` | 原生成器重建产物，唯一变化为 JSON-LD 的 Logo URL |
| `scripts/check-seo.mjs` | 比较逐页真实 Title/Description/OG 与配置（中英属性也核对）；核对 Sitemap 地址集合与重复地址；验证通用、Googlebot、Bingbot 的核心页面抓取许可，以及 meta/X-Robots-Tag 索引限制 |
| `scripts/parse-seo-markup.py` | 使用现有 Python 3 工具链的 HTMLParser/ElementTree 解析 head/XML，正确解码命名、十进制和十六进制字符实体；无第三方依赖 |
| `scripts/check-seo.test.mjs` | 六组 Node 内建测试，使用真实生成产物，只在内存中构造负例，不覆盖生产生成器 |
| 本报告 | 记录本次范围、验证与剩余边界 |

可见 `logo-white.svg` 文件和页面引用没有修改。没有修改正文、CSS、图片、字体、视频、3D、交互、语言架构、资源加载与缓存配置。检查器和解析工具位于生产目录外，不产生浏览器端请求或依赖。

## 检查器环境规则

`*.pages.dev` 自动使用 `preview`；其他主机默认使用 `production` 索引规则（本地 Pages 因而能检查拟上线产物的索引许可）。可显式传入 `--environment=production` 或 `--environment=preview`；正式 `rminte.com` / `www.rminte.com` 不允许误选 preview。

生产规则禁止核心页的 robots/googlebot/bingbot meta 或相关 X-Robots-Tag 带有 noindex/none。Pages 预览的 noindex 保留、记录为 `indexBlocked: true`，不会冒充预览已允许索引，也不会判定为生产缺陷。两种模式均验证源码 robots.txt 对核心 Canonical 页的抓取许可。

原始 HTTP HTML 仍为中文初始响应，因此检查中文 Title/Description/OG 实际值与配置，并核对现有 data-zh/data-en 属性；不将 `?lang=en` 的前端状态误当作服务端英文 HTML，不改语言架构。

运行方式：

```sh
node website/scripts/seo.mjs
node website/scripts/build-guides.mjs
node --test scripts/check-seo.test.mjs
node scripts/check-seo.mjs http://127.0.0.1:4189
node scripts/check-seo.mjs https://PREVIEW.pages.dev
```

仍需 Node 与 Python 3；沿用已有 Wrangler Pages dev、Playwright/Chrome、字体检查流程，没有引入测试平台或安装生产依赖。

## 本地已通过

- 六组针对性测试：真实产物正例、HTML 实体正例、空/错误 Title/Description/OG、同数量错误 Sitemap 地址及重复地址、禁止核心页抓取、生产 meta/header noindex/none；另验证预览 noindex 正常和正式域名不能误选 preview。
- `node scripts/check-seo.mjs http://127.0.0.1:4189`：45 个 GET，九类页面及中英/UTM 参数、别名、404、robots、Sitemap；17 项图像/静态资源 MIME 与字节检查（新增现有 PNG Logo 检查）。按生产索引规则通过。
- 原 SEO 和指南生成器重跑，产物幂等；指南正文及 search-index 没有变化。
- 相对 `e91b3ed`，19 个 HTML 文件（18 个内容文档和零字节 404 资源）的正文不变。首页除了 JSON-LD Logo URL 的替换，其他字节相同，可执行 head 脚本和 script/style/preload/icon 引用顺序与属性不变。网站其余资源/业务代码没有 diff。
- 首页 zh/en × 1440/390 四种 Chrome 状态，正文哈希、可见白色 Logo 与原 PR 一致，外部 HTTP 资源 URL 集合不变，无缺失翻译。跨不同本地服务器的 Range/cache 事件及已有 inline cursor SVG 不作为“请求次数完全相同”的证明。
- Node 脚本语法、Python 编译、`git diff --check`，以及 `python3 website/scripts/build-fonts.py --check` 通过；无需重建字体。

测试日志和本地 HTTP/浏览器/不变性记录位于 `output/seo-20261011/closeout/`，不纳入网站或代码提交。先前全站视觉与交互结果保持为历史证据，本轮没有冒称重新执行完整 36 组截图或所有交互。

## 未执行与发布边界

没有运行生产上线后的新检查器、Search Console、Rich Results Test、真实 Googlebot 渲染、性能评分或 HDR 硬件验收。当前生产尚未包含本 PR，不能将本地生产规则正例称作生产上线验收。推送更新可能由 GitHub 集成自动生成 Pages 分支预览，预览结果另在 PR 说明中报告；不合并或部署生产。

抓取/索引判断分别依据 [Google robots 规则](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec) 与 [robots meta/X-Robots-Tag 规范](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)。本检查器验证当前九类核心页和列出的常见限制，不声称替代搜索引擎的完整索引判定。

回退本次追加提交即可恢复原 PR；不会回退或改动原 SEO 方案。生产生成器没有被审查测试替身替换。
