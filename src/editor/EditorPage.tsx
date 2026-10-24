import {
  AlertTriangle,
  ArrowLeft,
  Columns2,
  Copy,
  Download,
  Eye,
  FileCode2,
  FilePlus2,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  ImagePlus,
  Info,
  ListChecks,
  Package,
  PackageCheck,
  PanelLeft,
  PanelRight,
  Play,
  Plus,
  Trash2,
  Check,
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

type EditorLayout = 'code' | 'split' | 'preview';

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
  const [layout, setLayout] = useState<EditorLayout>('split');
  const [preview, setPreview] = useState<WikiDocument | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [assetUrls, setAssetUrls] = useState<Record<string, string>>({});
  const [panel, setPanel] = useState<'preview' | 'diagnostics'>('preview');
  const [snippetId, setSnippetId] = useState(SNIPPETS[0]?.id ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const editorRef = useRef<CodeEditorHandle>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const assetRef = useRef<HTMLInputElement>(null);
  const clearTimer = useRef<number | null>(null);

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
    try {
      const blob = await exportWorkspace({ manifest, articles, assets });
      downloadBlob(blob, `${manifest.id}-${manifest.version}.wikipkg`);
      notify('内容包已导出');
    } catch (error) {
      notify(error instanceof Error ? error.message : String(error));
    }
  };

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      clearTimer.current = window.setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    if (clearTimer.current) window.clearTimeout(clearTimer.current);
    setConfirmClear(false);
    resetWorkspace();
    notify('工作区已清空');
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

  const copyCurrent = async () => {
    if (!activeArticle) return;
    await navigator.clipboard.writeText(activeArticle.source);
    notify('源码已复制');
  };

  const downloadCurrent = () => {
    if (!activeArticle) return;
    downloadBlob(
      new Blob([activeArticle.source], { type: 'text/plain' }),
      `${activeArticle.slug}.${activeArticle.format}`,
    );
  };

  const errorCount = diagnostics.filter((item) => item.severity === 'error').length;
  const warningCount = diagnostics.filter((item) => item.severity === 'warning').length;

  return (
    <div className="editor-shell">
      <header className="editor-topbar">
        <div className="editor-title">
          <Link className="icon-button tip-below" to="/" data-tip="返回维基" aria-label="返回维基">
            <ArrowLeft size={16} />
          </Link>
          <strong>{manifest.title}</strong>
          <span>{manifest.id}</span>
        </div>
        <div className="editor-actions">
          <button
            type="button"
            className="icon-button"
            data-tip="新建 XAML 文稿"
            aria-label="新建 XAML 文稿"
            onClick={() => addArticle('xaml')}
          >
            <FilePlus2 size={16} />
          </button>
          <button
            type="button"
            className="icon-button"
            data-tip="新建 Markdown 文稿"
            aria-label="新建 Markdown 文稿"
            onClick={() => addArticle('md')}
          >
            <FileCode2 size={16} />
          </button>
          <button
            type="button"
            className="icon-button"
            data-tip="导入 .wikipkg"
            aria-label="导入内容包"
            onClick={() => importRef.current?.click()}
          >
            <FolderOpen size={16} />
          </button>
          <button
            type="button"
            className="icon-button"
            data-tip="导出 .wikipkg"
            aria-label="导出内容包"
            onClick={() => void handleExport()}
          >
            <PackageCheck size={16} />
          </button>
          <button
            type="button"
            className={`icon-button danger${confirmClear ? ' confirming' : ''}`}
            data-tip={confirmClear ? '再次点击确认清空' : '清空工作区'}
            aria-label={confirmClear ? '再次点击确认清空' : '清空工作区'}
            onClick={handleClear}
          >
            <Trash2 size={16} />
          </button>
        </div>
        <div className="segmented" role="group" aria-label="编辑器布局">
          <button
            type="button"
            className={layout === 'code' ? 'active' : undefined}
            data-tip="仅编辑"
            aria-label="仅编辑"
            onClick={() => setLayout('code')}
          >
            <PanelLeft size={15} />
          </button>
          <button
            type="button"
            className={layout === 'split' ? 'active' : undefined}
            data-tip="分栏"
            aria-label="分栏"
            onClick={() => setLayout('split')}
          >
            <Columns2 size={15} />
          </button>
          <button
            type="button"
            className={layout === 'preview' ? 'active' : undefined}
            data-tip="仅预览"
            aria-label="仅预览"
            onClick={() => setLayout('preview')}
          >
            <PanelRight size={15} />
          </button>
        </div>
      </header>

      <div className={`editor-body layout-${layout}`}>
        <aside className="editor-left">
          <section className="editor-panel">
            <h2>
              <Package size={13} aria-hidden="true" />
              内容包
            </h2>
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
            <h2>
              <FileText size={13} aria-hidden="true" />
              文稿
            </h2>
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
                    data-tip="删除文稿"
                    aria-label={`删除文稿 ${article.title}`}
                    onClick={() => removeArticle(article.slug)}
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
            {articles.length === 0 && <p className="panel-empty">暂无文稿</p>}
          </section>

          <section className="editor-panel">
            <h2>
              <ImageIcon size={13} aria-hidden="true" />
              媒体
            </h2>
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
                    data-tip="插入到光标处"
                    aria-label={`插入 ${asset.path}`}
                    disabled={!activeArticle}
                    onClick={() =>
                      editorRef.current?.insert(
                        `<Media src="./${asset.path}" type="${mediaKind(asset.mime)}" caption="" />`,
                      )
                    }
                  >
                    <Plus size={13} />
                  </button>
                  <button
                    type="button"
                    className="icon-button danger"
                    data-tip="删除媒体"
                    aria-label={`删除媒体 ${asset.path}`}
                    onClick={() => removeAsset(asset.path)}
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
                <button type="button" className="icon-button" data-tip="插入片段" aria-label="插入片段" onClick={insertSnippet}>
                  <Play size={14} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  data-tip="复制源码"
                  aria-label="复制源码"
                  onClick={() => void copyCurrent()}
                >
                  <Copy size={14} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  data-tip="下载当前文稿"
                  aria-label="下载当前文稿"
                  onClick={downloadCurrent}
                >
                  <Download size={14} />
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
              <FileText size={22} aria-hidden="true" />
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
              <Eye size={14} aria-hidden="true" />
              预览
            </button>
            <button
              type="button"
              className={panel === 'diagnostics' ? 'active' : undefined}
              onClick={() => setPanel('diagnostics')}
            >
              <ListChecks size={14} aria-hidden="true" />
              诊断 {errorCount + warningCount > 0 ? `(${errorCount + warningCount})` : ''}
            </button>
          </div>
          {panel === 'preview' ? (
            <div className="editor-preview">
              {preview ? (
                <>
                  <ArticleHeader meta={preview.meta} />
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
                      {item.severity === 'info' ? (
                        <Info size={13} aria-hidden="true" />
                      ) : (
                        <AlertTriangle size={13} aria-hidden="true" />
                      )}
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
        <span>
          <FileText size={12} aria-hidden="true" />
          {articles.length} 篇文稿
        </span>
        <span>
          <ImageIcon size={12} aria-hidden="true" />
          {assets.length} 个媒体
        </span>
        <span>
          <AlertTriangle size={12} aria-hidden="true" />
          {errorCount} 错误 / {warningCount} 警告
        </span>
        <span>
          <Check size={12} aria-hidden="true" />
          本地自动保存
        </span>
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

