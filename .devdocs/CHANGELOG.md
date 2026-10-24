<p style="font-size:28px;text-align:center;"><b>PCL2Wiki ChangeLog</b></p>

> 记录面向交付的变更；提交哈希在推送后回填。

---

## 2026.10.24-12:00:00 InitialInfrastructure

ChangedFiles:
```
.\package.json +1 -0
.\src\** +1 -0
.\docs\** +1 -0
.\scripts\content-index.mjs +1 -0
.\public\CNAME +1 -0
```

ChangeLog:
Num|File Name|Change Description|Change Time|Changer
----|----|----|----|----
1|package.json|Vite + React + TS 工程与脚本|2026.10.24-12:00:00|AI (PCL2Wiki)
2|src/core|WikiXAML/Markdown 解析与 AST|2026.10.24-12:00:00|AI (PCL2Wiki)
3|src/render|React 渲染器|2026.10.24-12:00:00|AI (PCL2Wiki)
4|src/wiki|维基路由、布局、评论挂载点|2026.10.24-12:00:00|AI (PCL2Wiki)
5|src/editor|编辑器与 .wikipkg 导入导出|2026.10.24-12:00:00|AI (PCL2Wiki)
6|.github/workflows|CI 与 GitHub Pages 部署|2026.10.24-12:00:00|AI (PCL2Wiki)

version: v26.0-Alpha 1

---

## 2026.10.24-13:10:00 PagesAndDomain

GitCommitHash: ea74664221897351ebda68cc5cddb658eba7f54a

ChangedFiles:
```
.\public\CNAME +1 -0
.\docs\00-DESIGN.zh.md +30 -10
```

ChangeLog:
Num|File Name|Change Description|Change Time|Changer
----|----|----|----|----
1|CNAME|GitHub Pages 自定义域|2026.10.24-13:10:00|AI (PCL2Wiki)
2|00-DESIGN.zh.md|记录 Pages/DNS/HTTPS 完成状态|2026.10.24-13:10:00|AI (PCL2Wiki)

version: v26.0-Alpha 1

---

## 2026.10.24-13:40: UIRefresh

ChangedFiles:
```
.\src\wiki\* +20 -14
.\src\editor\* +140 -60
.\src\styles\* +150 -12
```

ChangeLog:
Num|File Name|Change Description|Change Time|Changer
----|----|----|----|----
1|WikiLayout/HomePage/ArticleContent|隐藏编辑器入口|2026.10.24-13:40:00|AI (PCL2Wiki)
2|EditorPage|图标工具栏、布局分段、两步清空、媒体插入|2026.10.24-13:40:00|AI (PCL2Wiki)
3|CodeEditor|Markdown 包裹快捷键|2026.10.24-13:40:00|AI (PCL2Wiki)
4|base.css|tooltip、动效、目录/侧栏激活态、滚动条|2026.10.24-13:40:00|AI (PCL2Wiki)

version: v26.0-Alpha 1

---

## 2026.10.24-14:10: CubkArchive

ChangedFiles:
```
.\public\content\pcl2-oct-events\** +30 -0
.\tools\build-cubk-snapshot.mjs +1 -0
.\src\core\markdown.ts +12 -2
.\src\render\InlineNodes.tsx +5 -1
```

ChangeLog:
Num|File Name|Change Description|Change Time|Changer
----|----|----|----|----
1|content/pcl2-oct-events|新增十月事件内容包与 cubk 存档帖|2026.10.24-14:10:00|AI (PCL2Wiki)
2|tools/build-cubk-snapshot.mjs|快照重建与 manifest 哈希工具|2026.10.24-14:10:00|AI (PCL2Wiki)
3|markdown.ts|Markdown 独立图片渲染为图片块|2026.10.24-14:10:00|AI (PCL2Wiki)
4|InlineNodes.tsx|正文相对链接按资源解析|2026.10.24-14:10:00|AI (PCL2Wiki)

version: v26.0-Alpha 1

---

## 2026.10.24-17:00: OriginsPage

ChangedFiles:
```
.\public\content\pcl2-oct-events\** +20 -0
.\tools\build-cubk-snapshot.mjs +13 -0
```

ChangeLog:
Num|File Name|Change Description|Change Time|Changer
----|----|----|----|----
1|origins.xaml|起因页：起因链、证据、误读、时间线|2026.10.24-17:00:00|AI (PCL2Wiki)
2|assets/evidence/origins|8 张群聊与应用商店证据图|2026.10.24-17:00:00|AI (PCL2Wiki)
3|archive/chat|文字转录与原始群聊 zip|2026.10.24-17:00:00|AI (PCL2Wiki)
4|build-cubk-snapshot.mjs|manifest 收录起因页|2026.10.24-17:00:00|AI (PCL2Wiki)

version: v26.0-Alpha 1

---

## 2026.10.24-17:30: EvidenceGallery

ChangedFiles:
```
.\src\render\Blocks.tsx +80 -10
.\src\styles\base.css +60 -20
.\src\core\types.ts +4 -1
.\src\core\xaml.ts +4 -1
.\public\content\pcl2-oct-events\** +20 -20
```

ChangeLog:
Num|File Name|Change Description|Change Time|Changer
----|----|----|----|----
1|Blocks.tsx|滚动驱动粘性横幅画廊与锚点|2026.10.24-17:30:00|AI (PCL2Wiki)
2|evidence.xaml|证据存档预览页|2026.10.24-17:30:00|AI (PCL2Wiki)
3|origins.xaml|聊天记录移出正文、附图与内链|2026.10.24-17:30:00|AI (PCL2Wiki)
4|transcript|群员/群名 @ 标识|2026.10.24-17:30:00|AI (PCL2Wiki)

version: v26.0-Alpha 1

---

## 2026.10.25-00:45 ContentDelivery2

ChangedFiles:
```
.\package.json +1 -1
.\public\content\pcl2-oct-events\articles\videos.xaml +180 -0
.\public\content\pcl2-oct-events\articles\timeline.xaml +150 -0
.\public\content\pcl2-oct-events\articles\misreadings.xaml +130 -0
.\public\content\pcl2-oct-events\articles\community-fixes.xaml +120 -0
.\public\content\pcl2-oct-events\articles\announce-actions.xaml +150 -0
.\public\content\pcl2-oct-events\articles\sources.xaml +110 -0
.\public\content\pcl2-oct-events\articles\explainers.xaml +120 -0
.\public\content\pcl2-oct-events\articles\ddos.xaml +120 -0
.\public\content\pcl2-oct-events\articles\legal.xaml +140 -0
.\public\content\pcl2-oct-events\articles\disputes.xaml +130 -0
.\public\content\pcl2-oct-events\archive\videos\** +12 -0
.\public\content\pcl2-oct-events\assets\evidence\oct\** +2 -0
.\public\content\pcl2-oct-events\manifest.json +250 -20
```

ChangeLog:
Num|File Name|Change Description|Change Time|Changer
----|----|----|----|----
1|videos.xaml|争议视频归档：两段原件内嵌播放 + 转录 + 争议说明|2026.10.25-00:45:00|AI (PCL2Wiki)
2|timeline.xaml|事件时间线（10-19 ~ 10-24），补 DDoS 与 10-23 回应|2026.10.25-00:45:00|AI (PCL2Wiki)
3|misreadings.xaml|十条常见误读与谣言澄清|2026.10.25-00:45:00|AI (PCL2Wiki)
4|community-fixes.xaml|五类社区应对与改版风险|2026.10.25-00:45:00|AI (PCL2Wiki)
5|announce-actions.xaml|公告系统动作清单与调用链分析|2026.10.25-00:45:00|AI (PCL2Wiki)
6|sources.xaml|资料来源、存档范围与隐私规则|2026.10.25-00:45:00|AI (PCL2Wiki)
7|explainers.xaml|五段讲解视频归档（原件内嵌播放 + 转录）|2026.10.25-00:45:00|AI (PCL2Wiki)
8|ddos.xaml|10-22 DDoS 攻击数据、损失与官方表态|2026.10.25-00:45:00|AI (PCL2Wiki)
9|legal.xaml|合规与法律视角：法条、三家实现差异|2026.10.25-00:45:00|AI (PCL2Wiki)
10|disputes.xaml|后门指控与调查争议（三层结论边界）|2026.10.25-00:45:00|AI (PCL2Wiki)
11|privacy|移除公开包内的账号标识与内部称谓|2026.10.25-00:45:00|AI (PCL2Wiki)

version: v26.0-Alpha 2

---

License: TBD

GitHub@BlockConnectExp | BlockConnectLab@StarsailsClover
