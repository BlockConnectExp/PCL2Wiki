import {
  BlobReader,
  BlobWriter,
  TextReader,
  TextWriter,
  ZipReader,
  ZipWriter,
  type Entry,
  type FileEntry,
} from '@zip.js/zip.js';
import { safeParseManifest } from '../core/package';
import type { PackageArticle, PackageManifest } from '../core/types';
import type { EditorArticle, EditorAsset, WorkspaceSnapshot } from './store';

function isSafePath(path: string): boolean {
  if (!path || path.startsWith('/') || path.includes('\\') || path.includes(':')) return false;
  const segments = path.split('/');
  return segments.every((segment) => segment && segment !== '.' && segment !== '..');
}

async function sha256(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function asFileEntry(entry: Entry): FileEntry {
  if (!('getData' in entry) || typeof entry.getData !== 'function') {
    throw new Error(`压缩包条目不可读：${entry.filename}`);
  }
  return entry;
}

export function buildManifest(workspace: WorkspaceSnapshot): PackageManifest {
  const articles: PackageArticle[] = workspace.articles.map((article) => ({
    slug: article.slug,
    title: article.title,
    source: `articles/${article.slug}.${article.format}`,
  }));

  return {
    ...workspace.manifest,
    spec: 'pcl2wiki-package/1',
    articles,
    entry: articles[0]?.source,
    generator: 'pcl2wiki-editor/26.0.0-alpha.1',
    createdAt: new Date().toISOString(),
  };
}

export async function exportWorkspace(workspace: WorkspaceSnapshot): Promise<Blob> {
  const manifest = buildManifest(workspace);
  manifest.assets = await Promise.all(
    workspace.assets.map(async (asset) => ({
      path: asset.path,
      sha256: await sha256(asset.blob),
      bytes: asset.blob.size,
      mime: asset.mime,
    })),
  );

  const zip = new ZipWriter(new BlobWriter('application/zip'), { bufferedWrite: true });
  await zip.add('manifest.json', new TextReader(`${JSON.stringify(manifest, null, 2)}\n`));

  for (const article of workspace.articles) {
    await zip.add(`articles/${article.slug}.${article.format}`, new TextReader(article.source));
  }
  for (const asset of workspace.assets) {
    if (!isSafePath(asset.path)) throw new Error(`资源路径非法：${asset.path}`);
    await zip.add(asset.path, new BlobReader(asset.blob));
  }

  return (await zip.close()) as Blob;
}

export async function importWorkspace(file: File): Promise<WorkspaceSnapshot> {
  const reader = new ZipReader(new BlobReader(file));

  try {
    const entries = await reader.getEntries();
    const manifestEntry = entries.find((entry) => entry.filename === 'manifest.json');
    if (!manifestEntry) throw new Error('压缩包缺少 manifest.json');

    const rawManifest = JSON.parse(await asFileEntry(manifestEntry).getData(new TextWriter())) as unknown;
    const parsed = safeParseManifest(rawManifest);
    if (!parsed.ok) throw new Error(`manifest 校验失败：${parsed.message}`);

    const articles: EditorArticle[] = [];
    for (const article of parsed.manifest.articles) {
      if (!isSafePath(article.source)) throw new Error(`文稿路径非法：${article.source}`);
      const entry = entries.find((candidate) => candidate.filename === article.source);
      if (!entry) throw new Error(`压缩包缺少文稿：${article.source}`);
      const source = await asFileEntry(entry).getData(new TextWriter());
      articles.push({
        slug: article.slug,
        title: article.title,
        source,
        format: article.source.toLowerCase().endsWith('.md') ? 'md' : 'xaml',
      });
    }

    const assets: EditorAsset[] = [];
    for (const asset of parsed.manifest.assets ?? []) {
      if (!isSafePath(asset.path)) throw new Error(`资源路径非法：${asset.path}`);
      const entry = entries.find((candidate) => candidate.filename === asset.path);
      if (!entry) throw new Error(`压缩包缺少资源：${asset.path}`);
      const blob = await asFileEntry(entry).getData(new BlobWriter(asset.mime));
      assets.push({ path: asset.path, blob, mime: asset.mime, size: blob.size });
    }

    return { manifest: parsed.manifest, articles, assets };
  } finally {
    await reader.close();
  }
}

