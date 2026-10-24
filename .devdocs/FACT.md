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

License: TBD

GitHub@BlockConnectExp | BlockConnectLab@StarsailsClover

