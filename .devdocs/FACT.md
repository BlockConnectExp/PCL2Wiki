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

## 2026.10.24-14:10: CubkArchive 004

Files:
```
.\public\content\pcl2-oct-events\** +30 -0
.\tools\build-cubk-snapshot.mjs +1 -0
.\src\core\markdown.ts +12 -2
.\src\render\InlineNodes.tsx +5 -1
```

### What's Happened?

- 新增内容包 `pcl2-oct-events`，发布第一篇独立存档帖《PCL 2 的意识形态（cubk 存档）》。
- 存档物：全文转录（md:Block）、12 张原文配图、自包含 snapshot.html、article.md、渲染后 DOM、首屏/页尾截图、original-response.html 与 zip 打包。
- Markdown 独立成段的图片现在渲染为图片块；正文相对链接按内容包资源解析。
- 桌面《PCL2 Oct Events》聊天素材已盘点（9 图 + messages.txt），按 Owner 要求暂不发布，待补充整理。

### Any evidence?

```
npm run content:index  # 1 个内容包，1 篇文稿
npm run lint / typecheck / test / build  # pass
IAB screenshots: /wiki/ideology-of-pcl 渲染、图片、快照下载区
```

### FACTs

1. cubk 页面为 Angular SPA，curl 仅得外壳；快照通过 IAB 渲染后抽取 DOM 生成。
2. `tools/build-cubk-snapshot.mjs` 可在重新抓取后重建 snapshot.html 与 manifest 哈希。

version: v26.0-Alpha 1

---

## 2026.10.24-17:00: OriginsPage 005

Files:
```
.\public\content\pcl2-oct-events\articles\origins.xaml +1 -0
.\public\content\pcl2-oct-events\assets\evidence\origins\** +8 -0
.\public\content\pcl2-oct-events\archive\chat\** +2 -0
.\tools\build-cubk-snapshot.mjs +13 -0
.\public\content\pcl2-oct-events\articles\ideology-of-pcl.xaml +4 -0
```

### What's Happened?

- 发布起因页《起因：家长举报与渠道服关闭》（slug `origins`），内容包现有 2 篇文稿。
- 证据来源：Owner 提供的天养群聊 8 张截图 + 文字转录 + 原始素材 zip。
- 关键原话（管理员）："是有个 MC 服务器有未成年充钱然后被举报了，然后顺便把 PCL 就一起举报了"；"后面还要看脸会不会处罚 PCL"。
- 明确区分两条独立因果：PCL/HMCL 下载停用来自连带举报；《我的世界》中国版部分应用商店不可下载来自网易关闭渠道服。
- cubk 存档帖新增 SeeAlso 指向起因页。

### Any evidence?

```
npm run content:index  # 1 个内容包，2 篇文稿
npm run lint / typecheck / test / build  # pass
IAB screenshot: local /#/wiki/origins 完整渲染
```

### FACTs

1. 起因原话来自 [PCL] 龙腾猫跃（管理员）的群内说明，截图已归档。
2. 应用商店截图（小米 / vivo）只证明"当时不可下载"，不能证明下架原因；原因是 Owner 补充的渠道服关闭。
3. 群内"网易也死了 / 应该是家长的大手"是当时推测，已作为误读点单独标注。

version: v26.0-Alpha 1

---

## 2026.10.24-17:30: EvidenceGallery 006

Files:
```
.\src\core\types.ts +4 -1
.\src\core\xaml.ts +4 -1
.\src\render\Blocks.tsx +80 -10
.\src\styles\base.css +60 -20
.\public\content\pcl2-oct-events\articles\evidence.xaml +1 -0
.\public\content\pcl2-oct-events\articles\origins.xaml +20 -20
.\public\content\pcl2-oct-events\archive\chat\tianyang-2026-10-20-transcript.md +12 -12
```

### What's Happened?

- `<Gallery>` 升级为横幅画廊：3 张以上时启用“粘性视窗 + 滚动进度驱动轨道”，2 张时保持横向 scroll-snap。
- 画廊项支持 `id` / `label`，生成 `gallery-<id>` 锚点，正文可按编号内链。
- 新增证据页《证据存档预览》（3 个画廊、e1–e8），聊天记录从起因页正文移出；起因页正文只保留 2 张附图并链接到对应编号。
- 群员与群名统一附加 @ 标识（@天养、@龙腾猫跃、@路边一条、@零、@山雨摧危楼、@NKN、@Big_Cake）。

### Any evidence?

```
IAB + CDP Emulation 1440x900:
  .gallery-banner.is-pinned height=2013px
  track transform: 0px -> -1493px after scrolling
窄视口回退: .gallery-banner 无 is-pinned，横向 scroll-snap 可用
npm run lint / typecheck / test / build  # pass
CDP device metrics override 已在验证后清除
```

### FACTs

1. 滚动驱动画廊仅在宽度 ≥720px、非 reduced-motion、且画廊项 ≥3 时启用。
2. 起因页正文只保留 @龙腾猫跃 动态与小米商店两张附图；8 张原始截图全部在证据页。

version: v26.0-Alpha 1

---

License: TBD

GitHub@BlockConnectExp | BlockConnectLab@StarsailsClover

