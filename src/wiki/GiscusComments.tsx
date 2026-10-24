import { useEffect, useRef } from 'react';
import { SITE } from '../config/site';

export function GiscusComments({ term }: { term: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { enabled: commentsEnabled, repo, repoId, category, categoryId } = SITE.giscus;
  const enabled = commentsEnabled && Boolean(repoId && categoryId);

  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;

    container.replaceChildren();
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-repo', repo);
    script.setAttribute('data-repo-id', repoId);
    script.setAttribute('data-category', category);
    script.setAttribute('data-category-id', categoryId);
    script.setAttribute('data-mapping', 'specific');
    script.setAttribute('data-term', term);
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', 'preferred_color_scheme');
    script.setAttribute('data-lang', 'zh-CN');
    script.setAttribute('data-loading', 'lazy');
    container.appendChild(script);

    return () => container.replaceChildren();
  }, [category, categoryId, enabled, repo, repoId, term]);

  if (!enabled) return null;

  return (
    <section className="comments">
      <h2>评论</h2>
      <div ref={containerRef} />
    </section>
  );
}

