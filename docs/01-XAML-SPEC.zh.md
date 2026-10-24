# PCL2 Wiki 文稿与内容包规范

> 状态：v26.0-Alpha 1 实现基线
> 规范标识：`pcl2wiki-xaml/1`、`pcl2wiki-package/1`
> 说明：这里的 XAML 是自定义 XML 文稿方言，**不是** WPF/Xamarin XAML，不使用其类型系统。

---

## 1. 文件与命名约定

| 项目 | 约定 |
|---|---|
| 文稿扩展名 | `.xaml` |
| 兼容文稿 | `.md`（CommonMark + GFM 常用子集） |
| 根元素 | `<Article>` |
| 元素命名 | PascalCase，如 `<Section>`、`<CodeBlock>` |
| 属性命名 | camelCase 或小写单词，如 `title`、`language`、`slug` |
| 布尔属性 | 显式写值：`header="true"`，不写裸属性 |
| 空元素 | 必须自闭合：`<Media ... />`、`<Ref ... />` |
| 编码 | UTF-8 |
| 默认命名空间 | `https://pcl2.n0th1n3ssd0ma1n.top/schema/1` |
| Markdown 命名空间 | `https://pcl2.n0th1n3ssd0ma1n.top/markdown/1`，建议前缀 `md` |
| 资源路径 | 相对内容包根，使用 `/`，例如 `assets/cover.webp` |
| 注释 | 允许 `<!-- ... -->`，解析时忽略 |

命名空间为兼容性检查项：使用其他 URI 会产生 `SCH000` 警告，但元素仍按本地名解析；未声明 `md` 前缀时，`md:Block` 不会被识别。

---

## 2. 最小文章与完整示例

### 2.1 最小合法文稿

```xml
<Article
  xmlns="https://pcl2.n0th1n3ssd0ma1n.top/schema/1"
  title="示例条目"
  slug="example"
  lang="zh-CN">
  <Paragraph>正文，支持 **Markdown** 内联语法。</Paragraph>
</Article>
```

### 2.2 完整示例

```xml
<Article
  xmlns="https://pcl2.n0th1n3ssd0ma1n.top/schema/1"
  xmlns:md="https://pcl2.n0th1n3ssd0ma1n.top/markdown/1"
  title="量子计算"
  slug="quantum-computing"
  lang="zh-CN"
  updated="2026-10-24">

  <Infobox>
    <Infobox.Field label="领域">物理学 / 计算机科学</Infobox.Field>
    <Infobox.Field label="提出者">Richard Feynman (1982)</Infobox.Field>
    <Infobox.Image src="./media/feynman.jpg" caption="费曼" />
  </Infobox>

  <Section title="概述">
    <Paragraph>
      **量子计算**是一种利用[量子力学](./quantum-mechanics.md)现象进行信息处理的
      计算范式。与经典计算机使用 `bit` 不同，量子计算机使用 **量子比特(qubit)**。
    </Paragraph>
  </Section>

  <Section title="核心原理">
    <Paragraph>量子计算的两大基石：</Paragraph>
    <List type="ordered">
      <ListItem>**量子叠加**：一个量子比特可同时处于 |0⟩ 和 |1⟩ 的叠加态</ListItem>
      <ListItem>**量子纠缠**：多个量子比特之间建立非经典关联</ListItem>
    </List>
    <CodeBlock language="python" title="Qiskit 示例">
      from qiskit import QuantumCircuit
      qc = QuantumCircuit(2)
      qc.h(0)
      qc.cx(0, 1)
    </CodeBlock>
    <Media src="./media/bloch-sphere.mp4" type="video" caption="布洛赫球面动画" />
  </Section>

  <SeeAlso>
    <Link slug="quantum-mechanics" title="量子力学" />
  </SeeAlso>

  <References>
    <Ref id="1">Feynman, R. (1982). "Simulating Physics with Computers"</Ref>
    <Ref id="2">Shor, P. (1994). "Algorithms for Quantum Computation"</Ref>
  </References>
</Article>
```

---

## 3. 元数据

`<Article>` 根属性：

| 属性 | 必填 | 说明 |
|---|---|---|
| `title` | 是 | 文章标题，纯文本 |
| `slug` | 是 | 文章标识；缺省时由 `title` 生成 |
| `lang` | 否 | BCP-47，默认 `zh-CN` |
| `updated` | 否 | `YYYY-MM-DD` |
| `version` | 否 | 文稿版本 |
| `summary` | 否 | 摘要 |
| `tags` | 否 | 逗号分隔标签，如 `tags="物品,原版"` |

内容包清单里的 `articles[]` 会覆盖首页与侧栏展示所需的标题、标签与摘要；文稿内元数据用于文章页自身展示。

---

## 4. 块级元素

| 标签 | 关键属性 | 子元素 | 说明 |
|---|---|---|---|
| `<Infobox>` | - | `Infobox.Field`、`Infobox.Image` | 信息框，桌面端显示于右栏 |
| `<Infobox.Field>` | `label` | 文本/Markdown 内联 | 信息框字段 |
| `<Infobox.Image>` | `src`、`caption` | 无 | 信息框图片 |
| `<Section>` | `title` | 任意块级元素 | 章节，渲染为 `h2`，`title` 生成锚点 |
| `<Paragraph>` | `md:parse` | Markdown 内联 | 段落 |
| `<Heading>` | `level`（3-6） | Markdown 内联 | 子标题，默认 3 |
| `<List>` | `type`=`ordered\|unordered` | `<ListItem>` | 列表 |
| `<ListItem>` | - | Markdown 内联 | 列表项 |
| `<CodeBlock>` | `language`、`title` | 原样文本 | 代码块，不解析 Markdown |
| `<Table>` | - | `<TableRow>` | 表格 |
| `<TableRow>` | `header="true"` | `<TableCell>` | 行；表头行渲染为 `th` |
| `<TableCell>` | - | Markdown 内联 | 单元格 |
| `<Media>` | `src`、`type`、`caption`、`alt` | 无 | 图片/视频/音频/文件下载 |
| `<Math>` | `display` | 原样文本 | TeX 公式，`display="block"` 为块级 |
| `<Quote>` | `source` | 块级元素或文本 | 引用块 |
| `<Note>` | `type`=`note\|tip\|warning\|danger\|important` | 块级元素 | 语义提示块 |
| `<Details>` | `summary` | 块级元素 | 折叠块 |
| `<Summary>` | - | 文本 | `<Details>` 的标题子元素 |
| `<Gallery>` | - | `<Media>` | 图组 |
| `<SeeAlso>` | - | `<Link>` | 参见列表 |
| `<Link>` | `slug`、`title` | 无 | 参见条目（仅用于 `<SeeAlso>` 内） |
| `<References>` | - | `<Ref>` | 参考文献 |
| `<Ref>` | `id` | Markdown 内联 | 参考文献条目 |
| `<md:Block>` | - | CDATA 文本 | 块级 Markdown 区域 |

`<Media>` 的 `type` 取值：`image`、`video`、`audio`、`file`；缺省时按扩展名推断。

---

## 5. 文本与 Markdown 互操作

`<Paragraph>`、`<ListItem>`、`<TableCell>`、`<Infobox.Field>`、`<Ref>` 等文本节点默认按行内 Markdown 解析。

| 语法 | 结果 |
|---|---|
| `**粗体**`、`__粗体__` | 加粗 |
| `*斜体*`、`_斜体_` | 斜体 |
| `~~删除~~` | 删除线 |
| `` `代码` `` | 行内代码 |
| `[文本](https://example.com)` | 外部链接 |
| `[条目](./entry.md)`、`[条目](./entry.xaml)` | 站内条目链接 |
| `[条目](#章节)` | 当前条目锚点 |
| `![替代文本](assets/a.webp)` | 行内图片 |
| `$E = mc^2$` | 行内 TeX 公式 |
| `[[条目]]`、`[[条目|显示文本]]` | 站内条目链接 |

关闭某个元素及其子树的 Markdown 解析：

```xml
<Paragraph md:parse="off">这里原样显示 **星号** 与 [方括号]。</Paragraph>
```

`<md:Block>` 内是完整 Markdown，推荐用 CDATA 避免 XML 转义：

```xml
<md:Block><![CDATA[
## Markdown 章节

| 列 A | 列 B |
|---|---|
| 1 | 2 |
]]></md:Block>
```

独立成段的 Markdown 图片（`![替代文本](assets/a.webp)`）会被提升为图片块（`<Media>`）渲染，而不是行内小图。

安全边界：Markdown 中的原始 HTML 不会被执行，会降级为纯文本并产生 `MD002` 警告。

---

## 6. 独立 Markdown 文稿

内容包可混放 `.md` 文稿。Markdown 文稿使用 YAML frontmatter 提供元数据：

```md
---
slug: diamond
title: 钻石
tags: [物品, 原版]
lang: zh-CN
---

**钻石**是 Minecraft 中的基础材料。

## 获取

| 用途 | 说明 |
|---|---|
| 工具 | 钻石镐 |
```

解析链路：

```text
.md 文本 -> marked AST -> WikiDocument AST -> 同一 React 渲染器
.xaml 文本 -> DOM -> schema 归一化 -> WikiDocument AST -> 同一 React 渲染器
```

两源共享段落、标题、列表、表格、代码、公式、链接等结构；XAML 额外支持信息框、媒体、参见、参考文献等组件。

---

## 7. 链接与资源

### 7.1 条目链接

```xml
<Paragraph>参见 [量子力学](./quantum-mechanics.md)。</Paragraph>
<Paragraph>也可以写 [[量子力学]]。</Paragraph>
```

`.md` / `.xaml` 链接会被转换为条目 slug；锚点通过 `[文本](./entry.xaml#章节)` 指定。

### 7.2 资源路径

| 写法 | 解析 |
|---|---|
| `./assets/a.webp` | 当前内容包内的资源 |
| `assets/a.webp` | 同左 |
| `https://...` | 外部资源，仅 `<Media>` / 图片允许 |

禁止：`..`、绝对路径、盘符、`file:`、`javascript:`。

建议 `assets/` 使用稳定文件名；导入 `.wikipkg` 时会校验 `sha256` 与 `bytes`。

---

## 8. `.wikipkg` 内容包

### 8.1 物理结构

```text
manifest.json
articles/
  index.xaml
  quantum-computing.md
assets/
  feynman.jpg
  bloch-sphere.mp4
```

- 单文件 zip，扩展名 `.wikipkg`。
- 路径使用 `/`，禁止空段、`.`、`..`、反斜杠与绝对路径。
- 编辑器导出时写入 `sha256`、`bytes` 与 `mime`。

### 8.2 `manifest.json`

```json
{
  "spec": "pcl2wiki-package/1",
  "id": "quantum",
  "title": "量子计算条目",
  "version": "26.0.0",
  "language": "zh-CN",
  "entry": "articles/index.xaml",
  "articles": [
    {
      "slug": "quantum-computing",
      "title": "量子计算",
      "source": "articles/index.xaml",
      "tags": ["物理", "计算机"]
    }
  ],
  "assets": [
    {
      "path": "assets/feynman.jpg",
      "sha256": "<sha256>",
      "bytes": 123456,
      "mime": "image/jpeg"
    }
  ],
  "generator": "pcl2wiki-editor/26.0.0-alpha.1",
  "createdAt": "2026-10-24T12:00:00Z"
}
```

### 8.3 字段表

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `spec` | string | 是 | 固定 `pcl2wiki-package/1` |
| `id` | string | 是 | `[a-z0-9][a-z0-9-]{0,63}` |
| `title` | string | 是 | 内容包标题 |
| `version` | string | 是 | 内容包版本 |
| `language` | string | 是 | 默认语言 |
| `entry` | string | 否 | 入口文稿 |
| `articles` | Article[] | 是 | 文稿清单，可为空数组 |
| `assets` | Asset[] | 否 | 资源清单 |
| `generator` | string | 否 | 生成器标识 |
| `createdAt` | string | 否 | ISO 8601 |

`Article`：`slug`、`title`、`source` 必填，`tags`、`updated`、`summary` 可选。

`Asset`：`path`、`sha256`、`bytes`、`mime` 必填。

---

## 9. 校验与诊断

| 错误码 | 级别 | 含义 |
|---|---|---|
| `XML001` | error | XML 解析失败，正文停止渲染 |
| `SCH000` | warning | 命名空间与规范不一致 |
| `SCH001` | warning | 未知标签，跳过并显示诊断块 |
| `SCH002` | warning | 缺少必填属性（`title`、`slug`、`src`、`label`、`id`） |
| `SCH004` | error/warning | 元素位置或根元素非法 |
| `MD002` | warning | Markdown 原始 HTML 降级为纯文本 |
| `PKG001` | error | manifest 校验失败 |
| `PKG002` | error | 压缩包路径越界（Zip Slip） |

编辑器状态栏实时汇总错误与警告；错误不阻断继续写作，但导出前应在诊断面板处理。

---

## 10. 当前实现范围（v26.0-Alpha 1）

已实现：

- `.xaml` 与 `.md` 双源解析，进入同一 AST；
- 第 4 节列出的全部基础标签；
- 行内 Markdown、`md:Block`、`md:parse="off"`；
- 条目链接、素材相对路径、KaTeX 公式、表格、图组、引用、提示块、折叠块、参见、参考文献；
- 编辑器本地工作区、IndexedDB 自动保存、实时预览、诊断、媒体插入、`.wikipkg` 导入导出；
- GitHub Pages 静态部署与 giscus 评论挂载点。

v1.0 前计划补充：

- 条目内联引用标记与脚注编号；
- 跨内容包 `<SeeAlso>` 与依赖解析；
- 搜索索引、分类与标签筛选；
- Minecraft 数据组件（物品/配方/版本徽章）；
- 英文文档与包迁移工具。

---

## 11. 双源等价示例

Markdown 版：

```md
---
slug: diamond
title: 钻石
tags: [物品, 原版]
lang: zh-CN
---

**钻石**是 Minecraft 中重要的矿物材料。

## 获取

钻石矿石生成于 Y=-64 至 Y=16。

> 使用精准采集附魔可获得钻石矿石本体。
```

WikiXAML 版：

```xml
<Article
  xmlns="https://pcl2.n0th1n3ssd0ma1n.top/schema/1"
  title="钻石" slug="diamond" lang="zh-CN" tags="物品,原版">
  <Paragraph>**钻石**是 Minecraft 中重要的矿物材料。</Paragraph>
  <Section title="获取">
    <Paragraph>钻石矿石生成于 Y=-64 至 Y=16。</Paragraph>
  </Section>
  <Quote>使用精准采集附魔可获得钻石矿石本体。</Quote>
</Article>
```

---

License: TBD（建议内容 CC-BY-NC-SA-4.0，代码 MIT）

Watermark: GitHub@BlockConnectExp | BlockConnectLab@StarsailsClover
