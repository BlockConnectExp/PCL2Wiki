import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'public', 'content');
const outputFile = path.join(contentDir, 'index.json');

function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function normalizeSource(source) {
  return String(source ?? '')
    .replaceAll('\\', '/')
    .replace(/^\.\//, '');
}

async function readManifest(packageDir, problems) {
  const manifestPath = path.join(packageDir, 'manifest.json');
  let manifest;

  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch (error) {
    problems.push(`${path.basename(packageDir)}: manifest.json 读取失败 (${error.message})`);
    return null;
  }

  const required = ['spec', 'id', 'title', 'version', 'language', 'articles'];
  for (const field of required) {
    if (!manifest[field]) {
      problems.push(`${manifestPath}: 缺少字段 ${field}`);
      return null;
    }
  }

  if (!Array.isArray(manifest.articles)) {
    problems.push(`${manifestPath}: articles 必须是数组`);
    return null;
  }

  const articles = [];
  for (const article of manifest.articles) {
    if (!article?.slug || !article?.title || !article?.source) {
      problems.push(`${manifestPath}: 文稿缺少 slug/title/source`);
      continue;
    }

    const source = normalizeSource(article.source);
    const sourcePath = path.resolve(packageDir, source);
    if (!isInside(packageDir, sourcePath)) {
      problems.push(`${manifestPath}: 文稿路径越界 ${article.source}`);
      continue;
    }
    if (!existsSync(sourcePath)) {
      problems.push(`${manifestPath}: 文稿不存在 ${article.source}`);
      continue;
    }

    articles.push({
      slug: String(article.slug),
      title: String(article.title),
      packageId: String(manifest.id),
      source,
      tags: Array.isArray(article.tags) ? article.tags.map(String) : [],
      updated: article.updated ? String(article.updated) : undefined,
      summary: article.summary ? String(article.summary) : undefined,
      language: String(manifest.language),
    });
  }

  return {
    id: String(manifest.id),
    title: String(manifest.title),
    version: String(manifest.version),
    language: String(manifest.language),
    entry: manifest.entry ? normalizeSource(manifest.entry) : undefined,
    articles,
  };
}

async function main() {
  if (!existsSync(contentDir)) {
    await writeFile(outputFile, '{}\n', 'utf8');
    console.warn('[content] public/content 不存在，已生成空索引');
    return;
  }

  const dirents = await readdir(contentDir, { withFileTypes: true });
  const packageDirs = [];
  for (const dirent of dirents) {
    if (!dirent.isDirectory()) continue;
    const packageDir = path.join(contentDir, dirent.name);
    const manifestStat = await stat(path.join(packageDir, 'manifest.json')).catch(() => null);
    if (manifestStat?.isFile()) packageDirs.push(packageDir);
  }

  const problems = [];
  const packages = [];
  const articles = [];

  for (const packageDir of packageDirs) {
    const manifest = await readManifest(packageDir, problems);
    if (!manifest) continue;
    packages.push({
      id: manifest.id,
      title: manifest.title,
      version: manifest.version,
      language: manifest.language,
      entry: manifest.entry,
    });
    articles.push(...manifest.articles);
  }

  const index = {
    spec: 'pcl2wiki-index/1',
    generatedAt: new Date().toISOString(),
    packages,
    articles,
  };

  await writeFile(outputFile, `${JSON.stringify(index, null, 2)}\n`, 'utf8');

  if (problems.length > 0) {
    for (const problem of problems) console.warn(`[content] ${problem}`);
  }
  console.log(`[content] ${packages.length} 个内容包，${articles.length} 篇文稿`);
}

await main();

