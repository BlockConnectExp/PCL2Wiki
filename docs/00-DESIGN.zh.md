# PCL2Wiki 设计文档

> 状态：v26.0-Alpha 1 实现基线
> 日期：2026-10-24
> 范围：PCL2 启动器百科，Vite + React 前端，无后端
> 部署：`BlockConnectExp/PCL2Wiki`，GitHub Pages，自定义域 `pcl2.n0th1n3ssd0ma1n.top`
> 关联规范：[01-XAML-SPEC.zh.md](./01-XAML-SPEC.zh.md)

---

## 1. 结论摘要

PCL2Wiki 采用「静态内容包 + 客户端解析渲染」的 SPA 架构：

1. **技术栈**：Vite + React + TypeScript，`react-router` 负责 `/wiki/*` 与 `/editor` 双入口。
2. **文稿格式**：以 WikiXAML（`.xaml`，XML 方言）为主格式，`.md` 作为一等兼容格式；两者进入同一个 AST 后渲染。
3. **渲染时机**：浏览器访问文章时按需拉取文稿源码，在客户端完成「解析 -> 校验 -> Markdown 增强 -> React 渲染」，即 Markdown -> XAML -> h5/js/css 的运行时链路。
4. **渲染安全**：白名单标签 + 结构化 React 渲染，不使用 `dangerouslySetInnerHTML`，禁止脚本、事件属性与任意 iframe。
5. **编辑器**：`/editor` 为本地优先工作台，CodeMirror 6 编辑 + 实时预览 + 媒体管理 + 诊断面板，一键导出 `.wikipkg` 压缩包（XAML + manifest + 媒体），可导入继续编辑。
6. **共享内核**：`src/core` 同时服务维基页与编辑器预览，保证「编辑所见」与「线上所渲染」完全一致。
7. **内容即数据**：正式内容以内容包目录进仓，构建期只生成索引；更新内容不要求重新打包 JS。
8. **评论**：文章页挂载 giscus（GitHub Discussions），不需要后端与账号系统；未配置时组件静默隐藏。

`/editor` 的产物 `.wikipkg` 是唯一跨环境交换格式：复制给他人、放入 `content/`、导入在线编辑器，都能还原同一份文稿与媒体。

---

## 2. 目标与非目标

### 2.1 目标

| 编号 | 目标 |
|---|---|
| G1 | 搭建可持续扩展的 Vite + React + TS 基础设施（路由、构建、Lint、测试、CI、静态部署） |
| G2 | 支持 WikiXAML 原稿，并兼容 Markdown 文稿与 XAML 内嵌 Markdown |
| G3 | 文章在访问时渲染；章节锚点、目录、脚注、参考文献可深链 |
| G4 | 可嵌入文本、图像、音视频、表格、折叠、标签页、引用、对话稿、下载文件等 |
| G5 | `/editor` 支持快速编写、实时预览、媒体拖放、诊断与 `.wikipkg` 导出/导入 |
| G6 | 纯静态部署（GitHub Pages 等），无账号、无服务端依赖 |
| G7 | 内容按包隔离，可整包替换、增量更新、回滚 |
| G8 | UI 内容优先、克制清晰，桌面与移动端均可用 |

### 2.2 非目标（v1 不做）

| 编号 | 非目标 | 说明 |
|---|---|---|
| N1 | 账号、在线协作、评论、服务端保存 | v1 本地优先，导出包即协作载体 |
| N2 | 富文本所见即所得 | v1 是「源码 + 实时预览」，避免伪 WYSIWYG 的格式损耗 |
| N3 | 任意 HTML / JS / iframe 嵌入 | 安全边界，后续如需再引入沙箱机制 |
| N4 | 自动抓取 Minecraft 官方数据 | 物品/配方数据先用文稿显式描述，M4 后再考虑数据注册表 |
| N5 | 3D 模型、皮肤、地图实时查看器 | 预留组件位，v1 不实现 |
| N6 | 全文服务端搜索 | v1 用构建期生成的本地搜索索引 |

---

## 3. 核心决策

### D1 双源文稿：WikiXAML 为主，Markdown 为一等公民

- `.xaml` 提供组件化、结构化、可扩展能力；`.md` 提供低门槛写作与存量内容迁移。
- 两者不互相「文本转换」后才入库，而是各自解析为同一个 `WikiDocument` AST。
- XAML 内支持两种 Markdown：文本节点行内 Markdown（默认开启）与 `<md:Block>` 块级 Markdown（CDATA 区域）。
- **代价**：XML 的 `<`、`&` 需要转义；编辑器提供自动转义与粘贴 Markdown 转换来抵消。

### D2 访问时渲染，不做预渲染 HTML

- 构建期只做：内容扫描、索引生成、公式校验、资源复制。
- 运行期：`fetch` 原始文稿 -> 解析 -> 渲染。
- 好处：内容更新只需替换 `dist/content/`，不用重发 JS；调试所见即线上逻辑。
- **代价**：首屏依赖资源拉取；通过 HTTP 缓存、索引预取、文章分块懒加载控制。

### D3 单一仓库、内核分层，不引入 monorepo

- 形态是「一个 Vite 应用 + 一个共享 core 目录」，而不是多包 monorepo。
- 理由：当前团队与产物规模不需要 monorepo 的发布成本；后续若需要独立发布解析器，再把 `src/core` 提升为 workspace 包。

### D4 内容包即交换单位

- 目录形态：`content/<package-id>/manifest.json + articles/ + assets/`。
- 交换形态：`.wikipkg`（zip，可被解压即用）。
- 编辑器、仓库内容、线上加载共用同一套清单与路径规则，避免三套模型。

### D5 编辑器本地优先

- 文稿与媒体保存在浏览器 IndexedDB，自动保存，不依赖账户与服务器。
- 导出 `.wikipkg` 是正式交付动作；导入包可完整还原工作区。
- 支持 File System Access API 的浏览器可直接「打开目录 / 覆盖保存」，其他浏览器走下载导入。

### D6 白名单渲染与安全默认值

- 仅注册过的标签、属性、枚举值可以渲染。
- 不使用原始 HTML 注入；所有节点经 React 元素构造。
- 链接、资源、下载文件均走统一解析器与协议白名单。
- 未知标签在开发环境显示诊断占位，在生产环境降级为可见错误块并记录警告，不静默吞错。

### D7 样式方案：CSS 变量 + CSS Modules

- 不引入重型 UI 组件库或原子类框架，避免内容排版权重与定制成本。
- `tokens.css` 定义颜色、字号、间距、圆角、阴影、动效；组件用 CSS Modules。
- 组件圆角统一 ≤ 8px（编辑器面板、内容块同理），靠排版与留白建立层级。

### D8 静态托管 + 内容索引脚本

- 内容包直接放在 `public/content/<package-id>/`，原始 `.xaml` / `.md` / 媒体保持原样，运行时由浏览器拉取。
- `scripts/content-index.mjs` 在 `predev` 与 `prebuild` 扫描 manifest，生成 `public/content/index.json`（已纳入 `.gitignore`）。
- 内容变更只影响 `content/` 下的静态文件与索引，不需要重新打包应用 JS。

### D9 路由与深链

- v26.0-Alpha 1 使用 `HashRouter`，同一份构建同时适配 GitHub Pages 项目路径与自定义域根路径。
- 文章 URL 形如 `#/wiki/:slug`，锚点形如 `#/wiki/:slug#章节`；giscus 使用 `mapping="specific"` 避免 hash 路由冲突。
- 自定义域 HTTPS 稳定后可评估切换 `BrowserRouter` + `404.html`，业务组件不需要改动。

### D10 命名与版本

- 文件扩展名沿用 Owner 指定的 `.xaml`；方言内部标识为 `pcl2wiki-xaml/1`，避免与 WPF XAML 混淆。
- 项目版本遵循组织规范：`v26.0-Alpha 1` 起步，M0 完成后发 Alpha 1。

---

## 4. 系统架构

### 4.1 总览

```text
                    ┌──────────────────────────┐
                    │ content/<pkg>/           │
                    │  manifest.json           │
                    │  articles/*.xaml|*.md    │
                    │  assets/*                │
                    └────────────┬─────────────┘
                                 │ build: 扫描/校验/索引/复制
                                 ▼
                      dist/content/index.json
                      dist/content/<pkg>/**
                                 │
            访问 /wiki/:slug     │ fetch
                                 ▼
        ┌────────────────────────────────────────────┐
        │ src/core                                    │
        │  SourceAdapter  (xaml | md)                 │
        │  XmlParser -> SchemaValidator -> Normalizer │
        │  MarkdownEnricher (inline / md:Block)        │
        │  Resolver (链接/资源/include/脚注)           │
        │  Registry -> BlockRenderer / InlineRenderer │
        └───────────────────┬────────────────────────┘
                            │ 同一渲染核
        ┌───────────────────┴────────────────────────┐
        │ /editor                                     │
        │  CodeMirror + WorkspaceStore + LivePreview  │
        │  Diagnostics + AssetTray + PackageIO        │
        └────────────────────────────────────────────┘
```

### 4.2 运行时渲染链路

```text
路由命中 slug
  -> ContentRepository.getArticle(slug)
  -> SourceAdapter：按扩展名选择 .xaml / .md 解析器
  -> XML 解析（DOMParser, application/xml）
  -> Schema 校验：标签、属性、枚举、必填项
  -> 归一化：标题编号、ID、默认值、别名
  -> Markdown 增强：文本节点行内 MD + md:Block
  -> 解析引用：wiki 链接、include、资源 URL、脚注、上下篇
  -> AST -> React 元素
  -> ArticleLayout：目录、信息框、脚注、相关条目、编辑入口
```

### 4.3 编辑器链路

```text
CodeMirror 输入
  -> 300ms 防抖
  -> 与维基页完全相同的 core 解析/校验/渲染
  -> 预览更新 + 诊断列表更新
  -> 工作区变更写 IndexedDB（500ms 防抖）
  -> 导出：PackageIO -> .wikipkg
```

### 4.4 内容仓库抽象

```ts
interface ContentRepository {
  listArticles(): Promise<ArticleIndexEntry[]>;
  getArticle(slug: string): Promise<ArticleSource>;
  getAsset(path: string): Promise<AssetHandle>;
  search(query: string): Promise<SearchHit[]>;
}
```

| 实现 | 用途 |
|---|---|
| `StaticRepository` | 线上：`fetch` `dist/content/` |
| `DevRepository` | 开发：`import.meta.glob` 读取 `content/` |
| `MemoryRepository` | 编辑器：内存/IndexedDB 工作区，零网络 |

---

## 5. 内容与包模型

### 5.1 仓库目录

```text
content/
├── index.generated.json          # 构建产物，不入库
└── oxygen-mods/                  # 一个内容包
    ├── manifest.json
    ├── articles/
    │   ├── index.xaml
    │   ├── diamond.xaml
    │   └── openlumin.md
    └── assets/
        ├── openlumin-cover.webp
        └── crafting-diamond.png
```

### 5.2 manifest.json（包清单）

```json
{
  "spec": "pcl2wiki-package/1",
  "id": "oxygen-mods",
  "title": "Oxygen 模组百科",
  "version": "26.1.0",
  "language": "zh-CN",
  "entry": "articles/index.xaml",
  "articles": [
    {
      "slug": "index",
      "title": "首页",
      "source": "articles/index.xaml",
      "tags": ["导航"]
    }
  ],
  "assets": [
    {
      "path": "assets/openlumin-cover.webp",
      "sha256": "<sha256>",
      "bytes": 182734,
      "mime": "image/webp"
    }
  ],
  "generator": "pcl2wiki-editor/26.0.0-alpha.1",
  "createdAt": "2026-10-24T12:00:00Z"
}
```

完整字段与校验规则见 [01-XAML-SPEC.zh.md](./01-XAML-SPEC.zh.md) 第 9 节。

### 5.3 构建期索引

```json
{
  "spec": "pcl2wiki-index/1",
  "generatedAt": "2026-10-24T12:00:00Z",
  "packages": [
    { "id": "oxygen-mods", "title": "Oxygen 模组百科", "version": "26.1.0", "entry": "index" }
  ],
  "articles": [
    {
      "slug": "diamond",
      "title": "钻石",
      "package": "oxygen-mods",
      "tags": ["物品", "原版"],
      "updated": "2026-10-24",
      "summary": "Minecraft 基础矿物与合成材料。",
      "headings": [{ "id": "获取", "text": "获取", "level": 2 }]
    }
  ]
}
```

### 5.4 内容更新流程

1. 在 `/editor` 写作、预览、导出 `oxygen-mods-26.1.0.wikipkg`。
2. Owner 把包复制进 `content/`，解压为 `content/oxygen-mods/`（或用 `npm run content:add -- <包路径>` 安全解压）。
3. 提交 Git，触发 CI：`lint -> typecheck -> test -> build`。
4. 构建产物 `dist/` 发布到 GitHub Pages；内容更新不需要改 JS。
5. 回滚 = 回滚 Git 提交或替换整包目录。

---

## 6. 渲染核设计

### 6.1 AST 类型草案

```ts
type WikiNode =
  | { type: "element"; tag: string; attrs: Record<string, string>; children: WikiNode[]; id?: string }
  | { type: "text"; value: string }
  | { type: "markdown-inline"; value: string }
  | { type: "markdown-block"; value: string; sourcePos?: SourcePos }
  | { type: "component"; name: string; props: Record<string, unknown>; children: WikiNode[] };

interface WikiDocument {
  meta: ArticleMeta;
  children: WikiNode[];
  diagnostics: Diagnostic[];
  headings: HeadingEntry[];
}
```

### 6.2 处理阶段

| 阶段 | 输入 | 输出 | 失败策略 |
|---|---|---|---|
| Decode | 字节流 | UTF-8 文本 | 非法编码报 `ENC001` |
| XML Parse | 文本 | DOM | 格式错误报 `XML001`，停止渲染正文 |
| Schema Check | DOM | 校验后的 DOM + 诊断 | 未知标签降级，必填缺失标错 |
| Normalize | DOM | `WikiNode[]` | 补默认值、生成 ID |
| MD Enrich | 文本节点 | 行内/块级 MD AST | 解析失败保留原文并报 `MD001` |
| Resolve | AST + 仓库 | 可渲染 AST | 缺失资源占位并报 `LNK/AST` |
| Render | AST | React 元素 | 块级 ErrorBoundary 隔离 |

### 6.3 组件注册表

- `registry.ts` 维护 `tag -> React 组件` 映射，是白名单的唯一来源。
- 每个组件声明：允许的属性、子节点约束、是否可出现在行内、目录贡献、锚点贡献。
- Minecraft 专用组件独立成 `registry.mc.ts`，通过包清单的 `profiles: ["minecraft"]` 启用。
- 第三方扩展后续可通过注册 API 增加组件，但仍受 schema 白名单约束。

### 6.4 标题、目录与锚点

- `h2`/`h3`/`h4` 进入目录树；`h1` 保留给文章标题。
- 锚点优先取显式 `id`，否则由标题文本 slug 化；重复时追加 `-2`、`-3`。
- 目录支持滚动跟随（scrollspy），移动端折叠为「本页目录」。

---

## 7. Markdown 兼容策略

| 场景 | 写法 | 行为 |
|---|---|---|
| 独立 Markdown 文章 | `articles/foo.md` | `marked` 解析为同一 AST |
| XAML 块级 Markdown | `<md:Block><![CDATA[ ... ]]></md:Block>` | 区块内按 Markdown 解析，不要求 XML 转义 |
| XAML 行内 Markdown | `<p>**粗体**与 [链接](https://example.com)</p>` | 文本节点默认启用行内 Markdown |
| 关闭行内 Markdown | `<Paragraph md:parse="off">原样显示 ** 字符</Paragraph>` | 该元素按纯文本渲染 |
| 代码与公式 | `<CodeBlock>` / `<Math>` | 内部不解析 Markdown |

支持的 Markdown 语法基线：CommonMark + GFM（表格、任务列表、删除线、自动链接）+ TeX 行内/块级公式 + 脚注。

扩展语法（非标准 Markdown，仅 WikiXAML 与 Markdown 源都可识别）：

- `[[条目名]]`、`[[条目名|显示文本]]`、`[[条目名#章节]]` 维基内链。
- `^[脚注内容]` 行内脚注。
- `:tip[提示内容]` 语义块（编辑器转换时优先生成 XAML `<note>`）。

转换工具：

- 编辑器「粘贴 Markdown」：后续版本提供自动转换为 WikiXAML；v26.0-Alpha 1 以 `.md` 文稿与 `<md:Block>` 手工混排为主。
- 编辑器「导出 Markdown」：仅支持 Markdown 可表达的子集，遇到 Minecraft 组件时输出清单与警告，不做有损静默转换。

---

## 8. 安全模型

| 面 | 规则 |
|---|---|
| 标签 | 仅注册表白名单；`script`、`style`、`iframe`、`object`、`embed`、`form` 一律拒绝 |
| 属性 | 拒绝 `on*`；`class`/`style` 不接受自由文本，使用语义属性映射令牌 |
| URL | 允许 `https:`、`mailto:`、站内相对路径、`wiki:`；`http:` 仅开发环境；`javascript:`/`data:` 默认拒绝 |
| 资源 | 路径必须位于包根内，禁止 `..`、绝对路径、符号链接；媒体类型白名单 |
| SVG | 仅作为 `<img>` 静态图使用；不内联进 DOM，不执行脚本 |
| 压缩包 | 防 Zip Slip、限制单包大小与条目数、拒绝可执行扩展名 |
| HTML | v1 无原始 HTML 注入；所有内容经 AST 与 React 组件构造 |
| CSP | 静态托管配置 `default-src 'self'`，媒体与字体同源；如启用外链白名单再单独放开 |

---

## 9. 信息架构与界面

### 9.1 路由

| 路由 | 页面 | 说明 |
|---|---|---|
| `/` | 首页 | 包导航、最近更新、分类入口、搜索入口 |
| `/wiki/:slug` | 文章页 | 正文、目录、信息框、脚注、相关条目 |
| `/wiki/:slug/:anchor` | 锚点深链 | 打开并滚动到指定章节 |
| `/search` | 搜索结果 | 本地索引查询，支持标签与包筛选 |
| `/editor` | 编辑器 | 文件树、代码、预览、诊断、导入导出 |
| `/about` | 关于 | 格式说明、版本、许可证 |

### 9.2 维基页布局

```text
┌─────────────────────────────────────────────────────────────┐
│ 顶栏：Logo / 全局搜索(Ctrl+K) / 主题切换 / 编辑此页 / GitHub │
├───────────────┬──────────────────────────────┬──────────────┤
│ 左侧导航       │ 文章正文                      │ 右侧栏        │
│ 包 / 分类      │ 标题、元信息、导语            │ 本页目录      │
│ 文章树         │ 章节、表格、图组、配方        │ 信息框        │
│ 标签           │ 脚注、相关条目、上下篇        │ 版本/模组徽章 │
└───────────────┴──────────────────────────────┴──────────────┘
```

- 桌面三栏；窄屏合并为单栏，目录与信息框变为折叠区。
- 正文最大宽度约 72ch；信息密度取「百科阅读」而非「后台面板」。
- 视觉基调：中性浅色/深色底 + 单一主强调色（草方块绿）+ 语义色；不使用渐变球、厚重卡片堆叠。
- 图标按钮使用 lucide 图标并提供 tooltip；模式切换用分段控件。
- 圆角、间距、阴影全部走令牌；动效遵守 `prefers-reduced-motion`。

### 9.3 编辑器布局

```text
┌────────────────────────────────────────────────────────────────────┐
│ 工具栏：新建 / 导入 / 导出 / 校验 / 预览模式 / 包设置              │
├───────────────┬──────────────────────────────┬────────────────────┤
│ 文件树        │ CodeMirror 6                 │ 实时预览            │
│ 文稿 / 媒体   │ XAML / Markdown 高亮         │ 与线上同一渲染器    │
│ 大纲          │ 行号、折叠、查找替换         │ 目录 / 锚点         │
│ 诊断          │ 片段面板（/ 触发）           │ 错误占位            │
└───────────────┴──────────────────────────────┴────────────────────┘
```

- 桌面三栏可拖拽；窄屏切为「文件 / 编辑 / 预览」三标签。
- 状态栏显示：当前文稿、包版本、未保存状态、诊断计数。

---

## 10. `/editor` 设计

### 10.1 工作区模型

```ts
interface Workspace {
  manifest: PackageManifest;
  articles: Map<string, ArticleDraft>;   // key: slug
  assets: Map<string, AssetBlob>;        // key: assets/ 相对路径
  openSlug: string | null;
  dirty: boolean;
  diagnostics: Diagnostic[];
}
```

- 持久化：IndexedDB（`idb`），文稿 500ms 防抖，媒体即时写入。
- 恢复：刷新页面自动恢复未导出工作区；首次进入给空白模板或导入包。

### 10.2 快速编写能力

| 能力 | 交互 |
|---|---|
| 片段面板 | 输入 `/` 或 `Ctrl+Space`，插入文章骨架、物品、配方、信息框、表格、图组 |
| 粘贴 Markdown | 粘贴时提示「转为 XAML / 保持 Markdown 块」 |
| 拖放媒体 | 图片/音频/视频拖入编辑器，自动写入 `assets/` 并插入标签 |
| 结构化表单 | 配方、信息框提供字段表单，生成对应 XAML，可再手改 |
| 实时诊断 | 未知标签、缺失属性、断链、缺失资源即时列出，点击跳转行号 |
| 大纲导航 | 标题树，一键跳到章节 |
| 预览模式 | 桌面并排 / 仅编辑 / 仅预览 / 全屏预览 |
| 自动保存 | IndexedDB + 状态栏「已保存/未导出」提示 |

### 10.3 导入与导出

**导出**

1. 校验包清单与全部文稿（阻断级错误必须修复）。
2. 收集文稿、媒体、许可证，生成确定性 zip：
   - 固定文件时间与排序，保证同内容包可复现；
   - manifest 写入每个资源的 `sha256` 与 `bytes`；
   - 文件名 `<package-id>-<version>.wikipkg`。
3. 下载；支持「仅导出当前文稿」为 `.xaml` / `.md`。

**导入**

1. 拖入 `.wikipkg` 或选择包。
2. 安全校验：zip 条目、大小、路径、manifest schema、资源哈希。
3. 通过后在编辑器中打开，可另存为覆盖下载。

### 10.4 快捷键（草案）

| 快捷键 | 动作 |
|---|---|
| `Ctrl+S` | 导出当前文稿 / 保存工作区快照 |
| `Ctrl+Shift+S` | 导出 `.wikipkg` |
| `Ctrl+O` | 导入包 |
| `Ctrl+K` | 插入链接 / 搜索 |
| `Ctrl+Space` | 片段面板 |
| `Ctrl+Shift+P` | 预览模式切换 |
| `F8` / `Shift+F8` | 下一条 / 上一条诊断 |

---

## 11. 技术选型

| 领域 | 选型 | 理由 |
|---|---|---|
| 构建 | Vite 8 + TypeScript 5.x | 启动快、生态成熟、静态部署简单 |
| UI | React 19 + react-router 7 | 组件模型适合递归 AST 渲染；路由清晰 |
| 编辑 | CodeMirror 6 | 体积小、可扩展、XAML/Markdown 高亮与 lint 成熟 |
| Markdown | marked + 自定义 Wiki 链接与公式占位 | 体积小，行内与块级共用一套 token 映射 |
| XML | 浏览器 `DOMParser` + 自研 schema 校验 | 无额外解析器依赖；错误定位可控 |
| 校验 | zod（manifest/runtime props）+ 自定义 schema 表 | 类型安全，编辑器与构建共用 |
| 压缩包 | `@zip.js/zip.js` | 支持流式与 Blob，比内存型库更适合媒体包 |
| 状态 | Zustand | 编辑器局部状态简单直接，不引入重型状态框架 |
| 持久化 | idb-keyval (IndexedDB) | 适合大体积媒体与多文稿 |
| 搜索 | MiniSearch（M3 计划） | 纯前端、索引小、支持前缀与加权 |
| 图标 | lucide-react | 统一的线性图标语言 |
| 样式 | CSS 变量 + 语义类 | 内容排版可控，无框架样式污染；规模上来后再拆 CSS Modules |
| 测试 | Vitest + jsdom（Playwright 计划中） | 单测覆盖解析器；E2E 覆盖编辑器导入导出 |
| 评论 | giscus | GitHub 登录、无后端、静态站点可用 |
| 质量 | ESLint + typescript-eslint + Prettier | 与组织现行前端项目一致 |

---

## 12. 目标项目结构

```text
PCL2Wiki/
├── .github/workflows/{ci.yml,deploy-pages.yml}
├── public/
│   ├── CNAME
│   └── content/                      # 内容包与生成的 index.json
├── scripts/content-index.mjs
├── docs/
│   ├── 00-DESIGN.zh.md
│   └── 01-XAML-SPEC.zh.md
├── src/
│   ├── core/
│   │   ├── {article,headings,markdown,package,repository,schema,text,types,xaml}.ts
│   ├── render/
│   │   ├── {ArticleContent,Blocks,InlineNodes,MathValue}.tsx
│   │   └── context.ts
│   ├── wiki/
│   │   ├── {ArticlePage,ContentIndexProvider,GiscusComments,HomePage}.tsx
│   │   ├── {NotFoundPage,Toc,WikiLayout}.tsx
│   ├── editor/
│   │   ├── {CodeEditor,EditorPage}.tsx
│   │   └── {package-io,persistence,snippets,store}.ts
│   ├── config/site.ts
│   ├── styles/{tokens,base}.css
│   └── main.tsx
├── tests/core/{xaml,markdown}.test.ts
├── index.html
├── package.json
├── tsconfig{,.app,.node}.json
├── vitest.config.ts
└── vite.config.ts
```

---

## 13. 性能、可访问性与国际化

### 13.1 性能预算

| 指标 | 预算 |
|---|---|
| 首屏 JS（gzip，不含内容） | ≤ 250 KB |
| `/editor` 独立分块 | 懒加载，不计入首屏 |
| 单篇 100 KB XAML 解析+渲染 | ≤ 80 ms（桌面 Chrome） |
| 搜索索引 | 10k 篇以内 ≤ 2 MB（可按语言拆分） |
| 内容资源 | 强缓存 + 哈希文件名；文稿短缓存 + ETag |

### 13.2 可访问性

- 语义化 `article/section/nav`、跳转到主内容、可见焦点环。
- 图标按钮必须有 `aria-label` 与 tooltip；不依赖颜色单独传达状态。
- 对比度满足 WCAG AA；支持 `prefers-reduced-motion`、`prefers-contrast`。
- 移动端输入字号 ≥ 16px，使用 `100dvh`，处理安全区。

### 13.3 国际化

- 文章元数据带 `lang`；正文混排默认按 HTML `lang` 标注。
- UI 文案抽到 `locales/zh-CN.json`，v1 只做中文，保留英文扩展位。
- 内容包可按语言拆包；同一 slug 多语言时用 `language` 字段区分。

---

## 14. 测试与验收

### 14.1 测试层次

| 层 | 工具 | 覆盖 |
|---|---|---|
| 单元 | Vitest | XML 解析、schema 校验、Markdown 增强、链接解析、路径安全 |
| 组件 | Testing Library | 块渲染、行内渲染、TOC、信息框、错误降级 |
| 契约 | JSON Schema fixture | `manifest.json` 与 `.wikipkg` 校验规则 |
| E2E | Playwright | 文章访问、深链、搜索、编辑器导入导出回环 |
| 视觉 | Playwright 截图 | 桌面/移动、浅色/深色、编辑器三栏 |

### 14.2 M0-M2 验收线

- M0：`npm run lint && npm run typecheck && npm run test && npm run build` 全绿；空壳站点可访问 `/` 与 `/editor`。
- M1：给定 fixture XAML/Markdown，渲染结果一致；TOC 与锚点正确；未知标签有诊断而非崩溃。
- M2：编辑器可导入示例包 -> 修改 -> 导出 -> 再导入，文稿与媒体字节级一致；诊断可定位行号。

---

## 15. 版本与发布规范

- 仓库独立 Git，主分支保护；每个大版本独立分支，提交签名。
- 版本号：`v26.0-Alpha 1`、`v26.0-Alpha 2` …… `v26.0`。
- M0 完成即发 `v26.0-Alpha 1` Pre-Release；正文渲染与编辑器闭环后发 Alpha 2。
- 文档中文为主，M0 起补英文版；正式 Release 前两版文档结构对齐。
- 提交信息使用英文，约定式提交；代码与文档插入仓库水印（解析远端后写入，不硬编码）。

---

## 16. 里程碑

### M0 基础设施（完成）

- Vite + React + TS 脚手架，路由、布局、设计令牌、基础页面。
- 内容索引脚本：扫描 `public/content/`，生成索引。
- `src/core` 类型、解析器、渲染器、内容仓库。
- ESLint/Prettier/Vitest/CI、GitHub Pages 工作流。
- 不添加示例文稿，空内容状态可正常访问。

### M1 渲染核（核心完成）

- XML 解析、schema 校验、AST、归一化、错误诊断。
- Markdown 源适配与 XAML 内 Markdown 增强。
- 块/行内渲染器、TOC、锚点、内部链接、KaTeX 公式。
- 基础组件：段落、标题、列表、表格、引用、代码、公式、图片、折叠、提示块。

### M2 编辑器（核心完成）

- CodeMirror XAML/Markdown 编辑、片段面板、媒体选择与插入。
- 工作区状态与 IndexedDB 持久化、实时预览、诊断面板。
- `.wikipkg` 导出/导入、当前文稿导出、示例模板。

### M3 百科体验（进行中）

- 搜索面板、分类导航、相关条目、上下篇、页面元数据。
- Minecraft 组件：物品/实体提示、配方网格、版本与加载器徽章、图组、下载。
- 深浅主题精修、移动端适配、可访问性与性能审计。

### M4 数据与发布（待办）

- 构建期内容校验报告、包版本迁移工具、英文文档。
- 可选：Minecraft 数据注册表接入（物品/配方数据校验）。
- 可选：PWA 离线缓存、模型/皮肤查看器组件。

---

## 17. 风险与对策

| 风险 | 影响 | 对策 |
|---|---|---|
| XML 转义摩擦 | 作者体验下降 | `<md:Block><![CDATA[...]]></md:Block>`、编辑器片段、后续粘贴转换 |
| XAML 命名与 WPF 混淆 | 搜索与沟通歧义 | 内部标识 `pcl2wiki-xaml/1`，文档明确「非 WPF XAML」 |
| 自定义格式锁定 | 迁移成本 | 同一 AST、Markdown 双源、导出 Markdown 子集、版本化 schema |
| 大媒体包内存压力 | 导出/导入崩溃 | 流式 zip、单包大小上限、分段导入与警告 |
| 静态托管深链失效 | 分享链接打不开 | v0.1 使用 HashRouter；自定义域稳定后评估 BrowserRouter + 404 回退 |
| 内容与渲染器漂移 | 编辑器预览与线上不一致 | 强制共享 `src/core`，E2E 校验同一 fixture |
| 组件无限膨胀 | 解析器难维护 | 注册表声明式定义，Minecraft 组件独立 profile，核心只保留通用块 |

---

## 18. 已确认决策

| 编号 | 决策 | 状态 |
|---|---|---|
| Q1 | 项目目录 `PCL2Wiki`，仓库 `BlockConnectExp/PCL2Wiki` | 已落地 |
| Q2 | 内容范围：PCL2 启动器百科，引擎保持通用 | 已确认 |
| Q3 | `.xaml` 扩展名 + PascalCase 标签 + `md:` 命名空间 | 已落地 |
| Q4 | 编辑器本地 IndexedDB，无后端、无账号 | 已落地 |
| Q5 | Markdown 双通道：独立 `.md` + `<md:Block>` | 已落地 |
| Q6 | 不添加示例文稿，空内容状态可用 | 已落地 |
| Q7 | 样式使用 CSS 变量 + 语义类，不引入 Tailwind | 已落地 |
| Q8 | 评论使用 giscus（GitHub Discussions），无后端 | 代码已就绪，待安装 GitHub App |
| Q9 | 自定义域 `pcl2.n0th1n3ssd0ma1n.top` | 待 DNS CNAME 指向 `blockconnectexp.github.io` |

---

## 19. 当前进度与下一步

已完成：

1. 独立仓库 `BlockConnectExp/PCL2Wiki`，默认分支 `main`，开发分支 `v26.0`。
2. Vite + React + TS 工程、Lint、类型检查、Vitest、内容索引脚本。
3. WikiXAML/Markdown 双源解析、统一 AST、React 渲染器、目录、锚点、KaTeX。
4. 维基页、首页空状态、`/editor` 工作台、`.wikipkg` 导入导出。
5. GitHub Pages 工作流、`public/CNAME`、giscus 挂载点。

待完成：

1. 首次提交推送到 `v26.0` 并合并到 `main`，触发 Pages 部署。
2. Cloudflare 添加 `pcl2` CNAME 到 `blockconnectexp.github.io`，Pages 设置自定义域并开启 HTTPS。
3. 在 `BlockConnectExp/PCL2Wiki` 安装 giscus GitHub App，并把仓库 ID / 分类 ID 写入 `VITE_GISCUS_*`。
4. M3：搜索面板、分类导航、标注/引用完善。
5. M4：内容校验收紧、包迁移工具、英文文档。

---

License: TBD（建议 CC-BY-NC-SA-4.0 用于内容，MIT 用于代码）

Watermark: 待仓库远端确定后按组织规范解析写入。
