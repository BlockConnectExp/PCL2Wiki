import {
  Download,
  FilePlus2,
  FileUp,
  ImagePlus,
  PackageOpen,
  Play,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { parseMarkdownArticle } from '../core/markdown';
import { fetchArticleSource, fetchContentIndex } from '../core/repository';
import type { Diagnostic, WikiDocument } from '../core/types';
import { parseWikiXaml } from '../core/xaml';
import { ArticleContent, ArticleHeader } from '../render/ArticleContent';
import { createRenderContext } from '../render/context';
import { CodeEditor, type CodeEditorHandle } from './CodeEditor';
import { exportWorkspace, importWorkspace } from './package-io';
import { loadWorkspace, saveWorkspace } from './persistence';
import { SNIPPETS } from './snippets';
import { useEditorStore } from './store';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function mediaKind(mime: string): 'image' | 'video' | 'audio' | 'file' {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'file';
}

export function EditorPage() {
  const {
    manifest,
    articles,
    assets,
    activeSlug,
    hydrated,
    setHydrated,
    replaceWorkspace,
    resetWorkspace,
    setManifest,
    addArticle,
    removeArticle,
    setActive,
    updateSource,
    updateArticleMeta,
    addAsset,
    removeAsset,
  } = useEditorStore();
  const [searchParams] = useSearchParams();
  const loadSlug = searchParams.get('load');
  const [preview, setPreview] = useState<WikiDocument | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [assetUrls, setAssetUrls] = useState<Record<string, string>>({});
  const [panel, setPanel] = useState<'preview' | 'diagnostics'>('preview');
  const [snippetId, setSnippetId] = useState(SNIPPETS[0]?.id ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const editorRef = useRef<CodeEditorHandle>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const assetRef = useRef<HTMLInputElement>(null);

  const activeArticle = useMemo(
    () => articles.find((article) => article.slug === activeSlug) ?? null,
    [activeSlug, articles],
  );

  useEffect(() => {
    void (async () => {
      const snapshot = await loadWorkspace();
      if (snapshot) replaceWorkspace(snapshot);
      setHydrated(true);
    })();
  }, [replaceWorkspace, setHydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      void saveWorkspace({ manifest, articles, assets });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [assets, articles, hydrated, manifest]);

  useEffect(() => {
    if (!hydrated || !loadSlug || articles.some((article) => article.slug === loadSlug)) return;
    void (async () => {
      const index = await fetchContentIndex();
      const entry = index.articles.find((article) => article.slug === loadSlug);
      if (!entry) return;
      const source = await fetchArticleSource(entry);
      replaceWorkspace({
        manifest: {
          spec: 'pcl2wiki-package/1',
          id: entry.packageId,
          title: index.packages.find((pkg) => pkg.id === entry.packageId)?.title ?? entry.packageId,
          version: index.packages.find((pkg) => pkg.id === entry.packageId)?.version ?? '0.1.0',
          language: entry.language ?? 'zh-CN',
          articles: [],
          assets: [],
        },
        articles: [
          {
            slug: entry.slug,
            title: entry.title,
            source,
            format: entry.source.toLowerCase().endsWith('.md') ? 'md' : 'xaml',
          },
        ],
        assets: [],
      });
    })();
  }, [articles, hydrated, loadSlug, replaceWorkspace]);

  useEffect(() => {
    if (!activeArticle) {
      setPreview(null);
      setDiagnostics([]);
      return;
    }
    const parsed =
      activeArticle.format === 'md'
        ? parseMarkdownArticle(activeArticle.source, activeArticle.slug)
        : parseWikiXaml(activeArticle.source, activeArticle.slug);
    setPreview(parsed);
    setDiagnostics(parsed.diagnostics);
  }, [activeArticle]);

  useEffect(() => {
    const urls: Record<string, string> = {};
    for (const asset of assets) urls[asset.path] = URL.createObjectURL(asset.blob);
    setAssetUrls(urls);
    return () => {
      for (const url of Object.values(urls)) URL.revokeObjectURL(url);
    };
  }, [assets]);

  const renderContext = useMemo(() => {
    const base = createRenderContext(activeArticle?.slug ?? 'editor', window.location.href);
    return {
      ...base,
      resolveAsset: (src: string) => {
        const key = src.replace(/^\.\//, '');
        return assetUrls[key] ?? src;
      },
    };
  }, [activeArticle?.slug, assetUrls]);

  const notify = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage((current) => (current === text ? null : current)), 2400);
  };

  const handleImport = async (file: File) => {
    try {
      const snapshot = await importWorkspace(file);
      replaceWorkspace(snapshot);
      notify(`已导入 ${snapshot.articles.length} 篇文稿`);
    } catch (error) {
      notify(error instanceof Error ? error.message : String(error));
    }
  };

  const handleExport = async () => {
    if (articles.length === 0) {
      notify('没有可导出的文稿');
      return;
    }
    const blob = await exportWorkspace({ manifest, articles, assets });
    downloadBlob(blob, `${manifest.id}-${manifest.version}.wikipkg`);
    notify('内容包已导出');
  };

  const handleAssetFiles = async (files: FileList | null) => {
    if (!files?.length || !activeArticle) return;
    const snippets: string[] = [];
    for (const file of Array.from(files)) {
      const path = await addAsset(file);
      snippets.push(`<Media src="./${path}" type="${mediaKind(file.type)}" caption="" />`);
    }
    editorRef.current?.insert(snippets.join('\n'));
  };

  const insertSnippet = () => {
    const snippet = SNIPPETS.find((item) => item.id === snippetId);
    if (snippet) editorRef.current?.insert(snippet.insert);
  };

  const errorCount = diagnostics.filter((item) => item.severity === 'error').length;
  const warningCount = diagnostics.filter((item) => item.severity === 'warning').length;

  return (
    <div className="editor-shell">
      <header className="editor-topbar">
        <div className="editor-title">
          <Link to="/">← 返回维基</Link>
          <strong>{manifest.title}</strong>
          <span>{manifest.id}</span>
        </div>
        <div className="editor-actions">
          <button type="button" onClick={() => addArticle('xaml')}>
            <FilePlus2 size={15} /> 新建 XAML
          </button>
          <button type="button" onClick={() => addArticle('md')}>
            <FilePlus2 size={15} /> 新建 Markdown
          </button>
          <button type="button" onClick={() => importRef.current?.click()}>
            <PackageOpen size={15} /> 导入包
          </button>
          <button type="button" onClick={() => void handleExport()}>
            <FileUp size={15} /> 导出包
          </button>
          <button type="button" onClick={() => void resetWorkspace()}>
            <Trash2 size={15} /> 清空
          </button>
        </div>
      </header>

      <div className="editor-body">
        <aside className="editor-left">
          <section className="editor-panel">
            <h2>内容包</h2>
            <label>
              <span>ID</span>
              <input
                value={manifest.id}
                onChange={(event) => setManifest({ id: event.target.value })}
              />
            </label>
            <label>
              <span>标题</span>
              <input
                value={manifest.title}
                onChange={(event) => setManifest({ title: event.target.value })}
              />
            </label>
            <label>
              <span>版本</span>
              <input
                value={manifest.version}
                onChange={(event) => setManifest({ version: event.target.value })}
              />
            </label>
            <label>
              <span>语言</span>
              <input
                value={manifest.language}
                onChange={(event) => setManifest({ language: event.target.value })}
              />
            </label>
          </section>

          <section className="editor-panel">
            <h2>文稿</h2>
            <ul className="editor-file-list">
              {articles.map((article) => (
                <li key={article.slug}>
                  <button
                    type="button"
                    className={article.slug === activeSlug ? 'active' : undefined}
                    onClick={() => setActive(article.slug)}
                  >
                    <span>{article.title}</span>
                    <small>{article.format}</small>
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => removeArticle(article.slug)}
                    title="删除文稿"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
            {articles.length === 0 && <p className="panel-empty">暂无文稿</p>}
          </section>

          <section className="editor-panel">
            <h2>媒体</h2>
            <button type="button" className="wide" onClick={() => assetRef.current?.click()}>
              <ImagePlus size={15} /> 添加媒体
            </button>
            <ul className="editor-asset-list">
              {assets.map((asset) => (
                <li key={asset.path}>
                  <span title={asset.path}>{asset.path.replace(/^assets\//, '')}</span>
                  <small>{formatBytes(asset.size)}</small>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => removeAsset(asset.path)}
                    title="删除媒体"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
            {assets.length === 0 && <p className="panel-empty">暂无媒体</p>}
          </section>
        </aside>

        <section className="editor-center">
          {activeArticle ? (
            <>
              <div className="editor-toolbar">
                <input
                  className="title-input"
                  value={activeArticle.title}
                  onChange={(event) =>
                    updateArticleMeta(activeArticle.slug, { title: event.target.value })
                  }
                />
                <input
                  className="slug-input"
                  value={activeArticle.slug}
                  onChange={(event) =>
                    updateArticleMeta(activeArticle.slug, { slug: event.target.value })
                  }
                />
                <select value={snippetId} onChange={(event) => setSnippetId(event.target.value)}>
                  {SNIPPETS.map((snippet) => (
                    <option key={snippet.id} value={snippet.id}>
                      {snippet.label}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={insertSnippet} title="插入片段">
                  <Play size={14} /> 插入
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadBlob(
                      new Blob([activeArticle.source], { type: 'text/plain' }),
                      `${activeArticle.slug}.${activeArticle.format}`,
                    )
                  }
                >
                  <Download size={14} /> 当前文稿
                </button>
              </div>
              <CodeEditor
                key={`${activeArticle.slug}:${activeArticle.format}`}
                ref={editorRef}
                value={activeArticle.source}
                format={activeArticle.format}
                onChange={(source) => updateSource(activeArticle.slug, source)}
              />
            </>
          ) : (
            <div className="editor-empty">
              <p>尚未选择文稿</p>
              <button type="button" onClick={() => addArticle('xaml')}>
                <FilePlus2 size={15} /> 新建 XAML
              </button>
            </div>
          )}
        </section>

        <section className="editor-right">
          <div className="editor-tabs">
            <button
              type="button"
              className={panel === 'preview' ? 'active' : undefined}
              onClick={() => setPanel('preview')}
            >
              预览
            </button>
            <button
              type="button"
              className={panel === 'diagnostics' ? 'active' : undefined}
              onClick={() => setPanel('diagnostics')}
            >
              诊断 {errorCount + warningCount > 0 ? `(${errorCount + warningCount})` : ''}
            </button>
          </div>
          {panel === 'preview' ? (
            <div className="editor-preview">
              {preview ? (
                <>
                  <ArticleHeader meta={preview.meta} slug={preview.meta.slug} />
                  <ArticleContent blocks={preview.blocks} context={renderContext} />
                </>
              ) : (
                <p className="panel-empty">暂无预览</p>
              )}
            </div>
          ) : (
            <div className="editor-diagnostics">
              {diagnostics.length === 0 ? (
                <p className="panel-empty">没有发现诊断信息</p>
              ) : (
                <ul>
                  {diagnostics.map((item, index) => (
                    <li key={`${item.code}-${index}`} className={item.severity}>
                      <code>{item.code}</code>
                      <span>{item.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </div>

      <footer className="editor-status">
        <span>{activeArticle ? activeArticle.slug : '未选择文稿'}</span>
        <span>{articles.length} 篇文稿</span>
        <span>{assets.length} 个媒体</span>
        <span>
          {errorCount} 错误 / {warningCount} 警告
        </span>
        <span>本地自动保存</span>
      </footer>

      <input
        ref={importRef}
        type="file"
        accept=".wikipkg,application/zip"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleImport(file);
          event.target.value = '';
        }}
      />
      <input
        ref={assetRef}
        type="file"
        multiple
        hidden
        onChange={(event) => {
          void handleAssetFiles(event.target.files);
          event.target.value = '';
        }}
      />
      {message && <div className="toast">{message}</div>}
    </div>
  );
}

