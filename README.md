**PCL2 Wiki**  
Wiki for the PCL2 October Incident (PCL2 十月事件维基)

在线站点：https://pcl2.n0th1n3ssd0ma1n.top/  
源码仓库：https://github.com/BlockConnectExp/PCL2Wiki

---

### 这是什么？

PCL2 Wiki 是一个**专注于 2026 年 10 月 PCL2（Plain Craft Launcher 2）相关事件**的静态维基站点。  
目标是把当时流传的说法、证据、时间线、技术分析与社区应对整理成可核对、可引用的文档，尽量区分**事实 / 推论 / 谣言**。

目前收录 **13 篇文稿**，覆盖起因、证据、争议视频、时间线、谣言清单、技术分析、DDoS、合规视角与调查争议等内容。

---

### 主要条目

| 标题 | 简要说明 |
|------|----------|
| PCL 2 的意识形态（cubk 存档） | cubk 事件评论全文存档与导读 |
| 起因：家长举报与渠道服关闭 | 区分“家长举报”与“网易关闭渠道服”两条因果链 |
| 证据存档预览 | 8 张原始证据截图分组预览 |
| 争议视频归档：后门演示与「云控」分析 | 两段传播最广视频的原件归档、转录与技术链条 |
| 时间线：2026 年 10 月 20 日前后 | 按小时记录事件发展，标注来源与可核验程度 |
| 常见误读与谣言清单 | 十条高流传说法的事实/推论/编造拆解 |
| 社区应对：补丁、替代启动器与风险 | 五种应对方式的代价与风险 |
| 公告系统与远程动作：技术分析 | 公告动作能力、调用链与证据边界 |
| 资料来源与存档说明 | 材料采集、校验与引用方式 |
| 讲解视频归档：五段事件复盘 | 五段讲解视频原件与转录 |
| DDoS 攻击：2026 年 10 月 22 日 | 攻击规模、影响与官方回应 |
| 合规与法律视角：为什么会是同一天 | 三家启动器同日关闭下载入口的合规背景 |
| 后门指控与调查争议 | 指控、回应、平台处理的时间线与可核实事实 |

---

### 技术栈

- **前端**：Vite + React + TypeScript
- **内容格式**：WikiXAML（`.xaml`）或 Markdown（`.md`），浏览器端解析渲染
- **编辑器**：内置 `/editor`（CodeMirror 6 + 实时预览 + 诊断 + 媒体管理）
- **内容包**：`.wikipkg` 压缩包（manifest + 文稿 + 媒体），可导入导出
- **部署**：GitHub Pages（Actions 自动构建），无后端
- **评论**：giscus（GitHub Discussions）

详细设计见仓库 `docs/00-DESIGN.zh.md`，格式规范见 `docs/01-XAML-SPEC.zh.md`。

---

### 本地开发

```bash
npm install
npm run dev        # 开发服务器
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm run test       # Vitest
npm run build      # 内容索引 + 生产构建
```

需要 **Node.js 22+**。

内容目录结构：

```
public/content/<package-id>/
├── manifest.json
├── articles/          # *.xaml 或 *.md
└── assets/
```

`npm run content:index` 会生成 `public/content/index.json`（构建产物，不入库）。

---

### 贡献与原则

1. **优先事实与可核验来源**，明确标注推论与未证实内容。
2. 不收录无法公开验证或仅本地留存的材料。
3. 欢迎通过 Issue / PR 补充证据、修正时间线或完善技术分析。
4. 贡献指南见 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

### 许可

- 内容：CC-BY-NC-SA-4.0  
- 代码：MIT  

---

GitHub@BlockConnectExp | BlockConnectLab@StarsailsClover
