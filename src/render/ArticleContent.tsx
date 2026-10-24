import type { BlockNode, WikiMeta } from '../core/types';
import { ArticleInfobox, Blocks } from './Blocks';
import type { RenderContext } from './context';

export function ArticleHeader({ meta, slug }: { meta: WikiMeta; slug: string }) {
  return (
    <header className="article-header">
      <h1>{meta.title}</h1>
      <div className="article-meta">
        {meta.updated && <span>更新于 {meta.updated}</span>}
        {meta.tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
        <a className="edit-link" href={`#/editor?load=${encodeURIComponent(slug)}`}>
          编辑此页
        </a>
      </div>
    </header>
  );
}

export function ArticleContent({
  blocks,
  context,
}: {
  blocks: BlockNode[];
  context: RenderContext;
}) {
  const infobox = blocks.find((block) => block.type === 'infobox');
  const body = blocks.filter((block) => block !== infobox);

  return (
    <>
      {infobox && <ArticleInfobox block={infobox} context={context} />}
      <Blocks blocks={body} context={context} />
    </>
  );
}

