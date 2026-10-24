// Rebuilds the archived cubk page snapshot and the content package manifest.
//
// Inputs are produced by the browser capture session and stored in .tmp-cubk/:
//   - article.html   (rendered <article> outerHTML)
//   - images/*       (article images downloaded from cubk.cn)
// Run: node tools/build-cubk-snapshot.mjs

import { createHash } from 'node:crypto';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmpDir = path.join(repoRoot, '.tmp-cubk');
const packageDir = path.join(repoRoot, 'public', 'content', 'pcl2-oct-events');
const archiveDir = path.join(packageDir, 'archive', 'cubk', 'ideology-of-pcl');

const SOURCE_URL = 'https://cubk.cn/articles/ideology-of-pcl';
const CAPTURED_AT = '2026-10-24T13:00:00+08:00';

function shell(fragment) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex">
<title>存档快照：PCL 2的意识形态 - cubk.cn</title>
<style>
  body { margin: 0; background: #f6f7f5; color: #1b2420; font: 16px/1.85 system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif; }
  .banner { padding: 12px 16px; background: #1f7a3f; color: #fff; font-size: 13px; }
  .banner a { color: #d8f3e0; }
  main { max-width: 860px; margin: 0 auto; padding: 32px 20px 72px; }
  img { max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #d9dfd7; }
  h1, h2, h3 { font-family: system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif; }
  h2 { border-bottom: 1px solid #d9dfd7; padding-bottom: 6px; }
  a { color: #1f7a3f; }
</style>
</head>
<body>
<div class="banner">PCL2 Wiki 存档快照 - 来源 <a href="${SOURCE_URL}">${SOURCE_URL}</a> - 抓取时间 ${CAPTURED_AT} - 原文可能持续更新，本快照为当时状态</div>
<main>
${fragment}
</main>
</body>
</html>
`;
}

function mimeOf(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.html': 'text/html',
    '.md': 'text/markdown',
    '.json': 'application/json',
    '.zip': 'application/zip',
  }[ext] ?? 'application/octet-stream';
}

async function collectAssets() {
  const entries = [];
  const walk = async (dir) => {
    for (const dirent of await readdir(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, dirent.name);
      if (dirent.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      const relative = path.relative(packageDir, fullPath).replaceAll('\\', '/');
      const info = await stat(fullPath);
      entries.push({
        path: relative,
        sha256: createHash('sha256').update(await readFile(fullPath)).digest('hex'),
        bytes: info.size,
        mime: mimeOf(relative),
      });
    }
  };
  await walk(path.join(packageDir, 'assets'));
  await walk(path.join(packageDir, 'archive'));
  return entries;
}

const fragmentPath = path.join(tmpDir, 'article.html');
const fragment = await readFile(fragmentPath, 'utf8');
const localized = fragment
  .replaceAll('src="/posts/ideology-of-pcl/images/', 'src="images/')
  .replaceAll('src="https://cubk.cn/posts/ideology-of-pcl/images/', 'src="images/');

await writeFile(path.join(archiveDir, 'snapshot.html'), shell(localized), 'utf8');

const assets = await collectAssets();
const manifest = {
  spec: 'pcl2wiki-package/1',
  id: 'pcl2-oct-events',
  title: 'PCL2 十月事件',
  version: '0.1.0',
  language: 'zh-CN',
  entry: 'articles/ideology-of-pcl.xaml',
  description: 'PCL2 十月事件（下载功能关闭风波）的事件记录、存档与社区反应。',
  articles: [
    {
      slug: 'ideology-of-pcl',
      title: 'PCL 2 的意识形态（cubk 存档）',
      source: 'articles/ideology-of-pcl.xaml',
      tags: ['十月事件', '存档', '第三方观点'],
      updated: '2026-10-24',
      summary: 'cubk 于 2026-10-21 发布的事件评论《PCL 2的意识形态》全文存档与导读。',
    },
    {
      slug: 'origins',
      title: '起因：家长举报与渠道服关闭',
      source: 'articles/origins.xaml',
      tags: ['十月事件', '起因', '证据'],
      updated: '2026-10-24',
      summary:
        '根据天养群聊记录整理的十月事件起因链，并区分“家长举报 PCL”与“网易关闭渠道服”两条独立因果。',
    },
    {
      slug: 'evidence',
      title: '证据存档预览',
      source: 'articles/evidence.xaml',
      tags: ['十月事件', '证据', '存档'],
      updated: '2026-10-24',
      summary:
        '十月事件起因页引用的 8 张原始证据截图，按官方表态、群聊记录与应用商店现状分组为滚动画廊。',
    },
  ],
  assets,
  generator: 'pcl2wiki-archive/0.1.0',
  createdAt: new Date().toISOString(),
};

await writeFile(path.join(packageDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`[archive] ${assets.length} assets indexed, snapshot.html rebuilt`);
