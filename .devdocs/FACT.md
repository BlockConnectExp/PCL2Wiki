<p style="font-size:28px;text-align:center;"><b>PCL2Wiki FACT</b></p>

> 记录已经验证的实现事实；未验证内容不得写入本节。

---

## 2026.10.24-12:00:00 InitialInfrastructure 001

Files:
```
.\package.json +1 -0
.\src\core\* +1 -0
.\src\render\* +1 -0
.\src\wiki\* +1 -0
.\src\editor\* +1 -0
.\scripts\content-index.mjs +1 -0
.\docs\*.md +1 -0
```

### What's Happened?

- 建立 `BlockConnectExp/PCL2Wiki` 与本地 `PCL2Wiki` 工程。
- 落地 WikiXAML / Markdown 双源解析、统一 AST 与 React 渲染器。
- 落地 `/editor` 工作台与 `.wikipkg` 导入导出。
- 配置 GitHub Pages 工作流与自定义域 CNAME。

### Any evidence?

```
npm run lint       # pass
npm run typecheck  # pass
npm run test       # 5 tests pass
npm run build      # pass; initial JS 106.34 kB gzip
```

### FACTs

1. 浏览器访问时渲染，构建期仅生成内容索引。
2. v26.0-Alpha 1 使用 HashRouter，与 GitHub Pages 子路径和自定义域均兼容。
3. 评论组件为 giscus，未配置 ID 时静默隐藏。

version: v26.0-Alpha 1

---

## 2026.10.24-13:10:00 PagesAndDomain 002

Files:
```
.\public\CNAME +1 -0
.\docs\00-DESIGN.zh.md +30 -10
```

### What's Happened?

- 创建 Cloudflare DNS 记录：`CNAME pcl2 -> blockconnectexp.github.io`，代理状态为仅 DNS。
- GitHub Pages 自定义域设为 `pcl2.n0th1n3ssd0ma1n.top`，并开启 HTTPS 强制。
- GitHub Actions `Deploy GitHub Pages` 在 `main` 上部署成功。

### Any evidence?

```
curl -s -o NUL -w "verify=%{ssl_verify_result} http=%{http_code}" https://pcl2.n0th1n3ssd0ma1n.top/
# verify=0 http=200 (remote 185.199.110.153)
curl https://pcl2.n0th1n3ssd0ma1n.top/content/index.json
# {"spec":"pcl2wiki-index/1", ...}
IAB screenshots: home page dark theme, /editor three-pane workspace
```

### FACTs

1. Cloudflare zone `n0th1n3ssd0ma1n.top` 的 DNS 已包含 `pcl2` CNAME。
2. GitHub Pages `build_type=workflow`，部署环境允许 `main` 与 `v26.0`。
3. giscus 组件已就绪但 `VITE_GISCUS_ENABLED=false`，未安装 App 前不会请求脚本。

version: v26.0-Alpha 1

---

## 2026.10.24-13:40: UIRefresh 003

Files:
```
.\src\wiki\WikiLayout.tsx +0 -8
.\src\wiki\HomePage.tsx +4 -6
.\src\wiki\Toc.tsx +20 -3
.\src\editor\EditorPage.tsx +120 -60
.\src\editor\CodeEditor.tsx +18 -0
.\src\styles\base.css +140 -10
```

### What's Happened?

- 隐藏维基侧全部编辑器入口：顶栏、侧栏、首页空状态与文章页"编辑此页"不再出现，`/editor` 路由保留直链访问。
- 编辑器工具栏改为图标按钮 + tooltip，新增布局分段控件（仅编辑 / 分栏 / 仅预览）。
- 清空工作区改为两步确认；媒体列表支持一键插入；新增复制源码。
- CodeMirror 新增 `Ctrl+B/I/E` Markdown 包裹与 `Ctrl+S` 拦截。
- 目录滚动跟随高亮、侧栏激活指示条、空状态插画、toast 与页面入场动效。

### Any evidence?

```
npm run lint / typecheck / test / build  # pass
IAB screenshots: home empty state, editor split/preview modes
```

### FACTs

1. 编辑器入口仅保留直链 `/editor`，正文页不再暴露编辑链接。
2. 所有新增动效均使用 transform/opacity，且被 `prefers-reduced-motion` 全局关闭。

version: v26.0-Alpha 1

---

License: TBD

GitHub@BlockConnectExp | BlockConnectLab@StarsailsClover

