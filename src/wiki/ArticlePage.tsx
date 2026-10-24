import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { SITE } from '../config/site';
import { parseArticle } from '../core/article';
import { articleAssetBase, fetchArticleSource } from '../core/repository';
import type { WikiDocument } from '../core/types';
import { ArticleContent, ArticleHeader } from '../render/ArticleContent';
import { createRenderContext } from '../render/context';
import { GiscusComments } from './GiscusComments';
import { useContentIndex } from './ContentIndexProvider';
import { NotFoundPage } from './NotFoundPage';
import { Toc } from './Toc';

export function ArticlePage() {
  const { slug = '' } = useParams();
  const location = useLocation();
  const { index, loading } = useContentIndex();
  const entry = index.articles.find((article) => article.slug === slug);
  const [articleDoc, setArticleDoc] = useState<WikiDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!entry) return;
    let cancelled = false;
    setError(null);
    setArticleDoc(null);

    void (async () => {
      try {
        const source = await fetchArticleSource(entry);
        if (!cancelled) setArticleDoc(parseArticle(source, entry));
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : String(reason));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [entry]);

  useEffect(() => {
    if (articleDoc) window.document.title = `${articleDoc.meta.title} - ${SITE.name}`;
  }, [articleDoc]);

  useEffect(() => {
    const anchor = location.hash.replace(/^#/, '');
    if (!anchor || !articleDoc) return;
    const element = window.document.getElementById(decodeURIComponent(anchor));
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [articleDoc, location.hash]);

  if (loading) return <p className="page-note">加载中…</p>;
  if (!entry) return <NotFoundPage />;
  if (error) {
    return (
      <section className="empty-state">
        <h1>文稿加载失败</h1>
        <p>{error}</p>
      </section>
    );
  }
  if (!articleDoc) return <p className="page-note">加载中…</p>;

  const context = createRenderContext(entry.slug, articleAssetBase(entry));
  const infobox = articleDoc.blocks.find((block) => block.type === 'infobox');
  const body = articleDoc.blocks.filter((block) => block !== infobox);

  return (
    <div className="article-layout">
      <article className="wiki-article">
        <ArticleHeader meta={articleDoc.meta} />
        <ArticleContent blocks={body} context={context} />
        <GiscusComments term={`wiki:${entry.slug}`} />
      </article>
      <aside className="article-rail">
        <Toc headings={articleDoc.headings} slug={entry.slug} />
        {infobox && <ArticleContent blocks={[infobox]} context={context} />}
      </aside>
    </div>
  );
}

