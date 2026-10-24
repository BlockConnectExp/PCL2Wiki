import { create } from 'zustand';
import type { PackageArticle, PackageManifest } from '../core/types';

export interface EditorArticle {
  slug: string;
  title: string;
  source: string;
  format: 'xaml' | 'md';
}

export interface EditorAsset {
  path: string;
  blob: Blob;
  mime: string;
  size: number;
}

export interface WorkspaceSnapshot {
  manifest: PackageManifest;
  articles: EditorArticle[];
  assets: EditorAsset[];
}

const GENERATOR = 'pcl2wiki-editor/26.0.0-alpha.1';

export function createDefaultManifest(): PackageManifest {
  return {
    spec: 'pcl2wiki-package/1',
    id: 'draft',
    title: '未命名内容包',
    version: '0.1.0',
    language: 'zh-CN',
    articles: [],
    assets: [],
    generator: GENERATOR,
  };
}

function articleSourcePath(article: EditorArticle): string {
  return `articles/${article.slug}.${article.format}`;
}

function syncManifest(manifest: PackageManifest, articles: EditorArticle[]): PackageManifest {
  const nextArticles: PackageArticle[] = articles.map((article) => ({
    slug: article.slug,
    title: article.title,
    source: articleSourcePath(article),
  }));
  return {
    ...manifest,
    articles: nextArticles,
    entry: nextArticles[0]?.source,
  };
}

function uniqueSlug(base: string, articles: EditorArticle[]): string {
  const used = new Set(articles.map((article) => article.slug));
  if (!used.has(base)) return base;
  let index = 2;
  while (used.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

function createArticle(format: 'xaml' | 'md', slug: string, lang: string): EditorArticle {
  const title = '未命名文稿';
  const source =
    format === 'md'
      ? `---\nslug: ${slug}\ntitle: ${title}\nlang: ${lang}\n---\n`
      : `<Article xmlns="https://pcl2.n0th1n3ssd0ma1n.top/schema/1" xmlns:md="https://pcl2.n0th1n3ssd0ma1n.top/markdown/1" title="${title}" slug="${slug}" lang="${lang}">\n</Article>\n`;

  return { slug, title, source, format };
}

function sanitizeFileName(name: string): string {
  const cleaned = name
    .normalize('NFKC')
    .replace(/[^\p{Letter}\p{Number}._-]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'asset.bin';
}

function uniqueAssetPath(name: string, assets: EditorAsset[]): string {
  const used = new Set(assets.map((asset) => asset.path));
  const first = `assets/${name}`;
  if (!used.has(first)) return first;

  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const extension = dot > 0 ? name.slice(dot) : '';
  let index = 2;
  while (used.has(`assets/${stem}-${index}${extension}`)) index += 1;
  return `assets/${stem}-${index}${extension}`;
}

interface EditorState {
  manifest: PackageManifest;
  articles: EditorArticle[];
  assets: EditorAsset[];
  activeSlug: string | null;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  replaceWorkspace: (snapshot: WorkspaceSnapshot) => void;
  resetWorkspace: () => void;
  setManifest: (patch: Partial<PackageManifest>) => void;
  addArticle: (format: 'xaml' | 'md') => string;
  removeArticle: (slug: string) => void;
  setActive: (slug: string | null) => void;
  updateSource: (slug: string, source: string) => void;
  updateArticleMeta: (slug: string, patch: Partial<Pick<EditorArticle, 'title' | 'slug'>>) => void;
  addAsset: (file: File) => Promise<string>;
  removeAsset: (path: string) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  manifest: createDefaultManifest(),
  articles: [],
  assets: [],
  activeSlug: null,
  hydrated: false,

  setHydrated: (value) => set({ hydrated: value }),

  replaceWorkspace: (snapshot) =>
    set({
      manifest: syncManifest(snapshot.manifest, snapshot.articles),
      articles: snapshot.articles,
      assets: snapshot.assets,
      activeSlug: snapshot.articles[0]?.slug ?? null,
      hydrated: true,
    }),

  resetWorkspace: () =>
    set({
      manifest: createDefaultManifest(),
      articles: [],
      assets: [],
      activeSlug: null,
    }),

  setManifest: (patch) => set((state) => ({ manifest: { ...state.manifest, ...patch } })),

  addArticle: (format) => {
    const state = get();
    const slug = uniqueSlug('article', state.articles);
    const article = createArticle(format, slug, state.manifest.language);
    const articles = [...state.articles, article];
    set({
      articles,
      activeSlug: slug,
      manifest: syncManifest(state.manifest, articles),
    });
    return slug;
  },

  removeArticle: (slug) => {
    const state = get();
    const articles = state.articles.filter((article) => article.slug !== slug);
    set({
      articles,
      activeSlug: articles[0]?.slug ?? null,
      manifest: syncManifest(state.manifest, articles),
    });
  },

  setActive: (slug) => set({ activeSlug: slug }),

  updateSource: (slug, source) =>
    set((state) => ({
      articles: state.articles.map((article) =>
        article.slug === slug ? { ...article, source } : article,
      ),
    })),

  updateArticleMeta: (slug, patch) =>
    set((state) => {
      const target = state.articles.find((article) => article.slug === slug);
      if (!target) return state;
      const nextSlug =
        patch.slug && patch.slug !== slug
          ? uniqueSlug(
              patch.slug,
              state.articles.filter((article) => article.slug !== slug),
            )
          : slug;
      const articles = state.articles.map((article) =>
        article.slug === slug ? { ...article, ...patch, slug: nextSlug } : article,
      );
      return {
        articles,
        activeSlug: state.activeSlug === slug ? nextSlug : state.activeSlug,
        manifest: syncManifest(state.manifest, articles),
      };
    }),

  addAsset: async (file) => {
    const state = get();
    const path = uniqueAssetPath(sanitizeFileName(file.name), state.assets);
    const asset: EditorAsset = {
      path,
      blob: file,
      mime: file.type || 'application/octet-stream',
      size: file.size,
    };
    set({ assets: [...state.assets, asset] });
    return path;
  },

  removeAsset: (path) =>
    set((state) => ({ assets: state.assets.filter((asset) => asset.path !== path) })),
}));

