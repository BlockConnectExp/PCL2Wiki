import { Clock, Tag } from 'lucide-react';
import type { BlockNode, WikiMeta } from '../core/types';
import { ArticleInfobox, Blocks } from './Blocks';
import type { RenderContext } from './context';

export function ArticleHeader({ meta }: { meta: WikiMeta }) {
  return (
    <header className="article-header">
      <h1>{meta.title}</h1>
      <div className="article-meta">
        {meta.updated && (
          <span>
            <Clock size={12} aria-hidden="true" />
            更新于 {meta.updated}
          </span>
        )}
        {meta.tags.map((tag) => (
          <span key={tag} className="tag">
            <Tag size={11} aria-hidden="true" />
            {tag}
          </span>
        ))}
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

