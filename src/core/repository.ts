import type { ArticleIndexEntry, ContentIndex } from './types';

const EMPTY_INDEX: ContentIndex = {
  spec: 'pcl2wiki-index/1',
  packages: [],
  articles: [],
};

function contentUrl(path: string): string {
  return new URL(`content/${path}`.replace(/^\/+/, ''), document.baseURI).toString();
}

export async function fetchContentIndex(): Promise<ContentIndex> {
  try {
    const response = await fetch(contentUrl('index.json'), { cache: 'no-cache' });
    if (!response.ok) return EMPTY_INDEX;
    const value = (await response.json()) as Partial<ContentIndex>;
    return {
      spec: value.spec ?? 'pcl2wiki-index/1',
      generatedAt: value.generatedAt,
      packages: Array.isArray(value.packages) ? value.packages : [],
      articles: Array.isArray(value.articles) ? value.articles : [],
    };
  } catch {
    return EMPTY_INDEX;
  }
}

export async function fetchArticleSource(entry: ArticleIndexEntry): Promise<string> {
  const response = await fetch(contentUrl(`${entry.packageId}/${entry.source}`), {
    cache: 'no-cache',
  });
  if (!response.ok) {
    throw new Error(`无法加载文稿：${entry.packageId}/${entry.source} (${response.status})`);
  }
  return response.text();
}

export function articleAssetBase(entry: ArticleIndexEntry): string {
  return contentUrl(`${entry.packageId}/`);
}

export { contentUrl };
