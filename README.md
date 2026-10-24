<p style="font-size:28px;text-align:center;"><b>PCL2Wiki</b></p>

> WikiXAML 驱动的 PCL2 百科，Vite + React 静态站点，无后端。

> [!NOTE]
> 内容原稿使用 `.xaml`（PascalCase 标签，兼容 Markdown）或 `.md`；访问文章时在浏览器解析并渲染。
> `/editor` 提供本地优先的写作工作台，可导出 `.wikipkg` 内容包。

---

## 1 项目简介

PCL2Wiki 面向 PCL2 启动器与其周边生态的文档整理，提供三件事：

1. **阅读**：`/` 首页与 `/wiki/:slug` 条目页，支持目录、锚点、信息框、公式、媒体与参考文献。
2. **写作**：`/editor` 编辑器，CodeMirror 6 + 实时预览 + 诊断 + 媒体管理 + `.wikipkg` 导入导出。
3. **交换**：`.wikipkg` 压缩包内含 `manifest.json`、`.xaml`/`.md` 文稿与媒体，可复制、解压、进仓。

详细设计见 [docs/00-DESIGN.zh.md](./docs/00-DESIGN.zh.md)，格式规范见 [docs/01-XAML-SPEC.zh.md](./docs/01-XAML-SPEC.zh.md)。

## 2 开发

```powershell
npm install
npm run dev        # 启动开发服务器
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm run test       # Vitest
npm run build      # 内容索引 + 生产构建
```

Node.js 22 或更高版本。

## 3 内容包

```text
public/content/<package-id>/
├── manifest.json
├── articles/
│   └── *.xaml | *.md
└── assets/
    └── *
```

`npm run content:index` 会生成 `public/content/index.json`（构建产物，不入库）。编辑器导出的 `.wikipkg` 解压到 `public/content/` 后即可被站点读取。

## 4 部署

- 推送 `main` 触发 `.github/workflows/deploy-pages.yml`。
- GitHub Pages 使用 Actions 构建产物，自定义域记录在 `public/CNAME`。
- 目标域名：`pcl2.n0th1n3ssd0ma1n.top`。
- 评论：giscus（GitHub Discussions），需要安装 giscus GitHub App 并提供 `VITE_GISCUS_REPO_ID` / `VITE_GISCUS_CATEGORY_ID`。

## 5 目录

```text
src/core/    解析、校验、Markdown、内容包与仓库
src/render/  AST -> React 渲染器
src/wiki/    维基页、布局、评论
src/editor/  编辑器、持久化、包导入导出
public/      CNAME 与内容包
scripts/     内容索引脚本
```

## 6 English

PCL2Wiki is a static Vite + React wiki for PCL2. Articles are authored in
WikiXAML (`.xaml`) or Markdown (`.md`), parsed in the browser at access time,
and rendered through a shared AST. The `/editor` workspace exports and imports
`.wikipkg` archives containing the manifest, articles and media.

---

License: TBD (content CC-BY-NC-SA-4.0 suggested, code MIT suggested)

GitHub@BlockConnectExp | BlockConnectLab@StarsailsClover

