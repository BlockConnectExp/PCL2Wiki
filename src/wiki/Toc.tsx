import { useEffect, useState } from 'react';
import type { HeadingEntry } from '../core/types';

export function Toc({ headings, slug }: { headings: HeadingEntry[]; slug: string }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-72px 0px -62% 0px', threshold: [0, 1] },
    );

    for (const heading of headings) {
      const element = window.document.getElementById(heading.anchor);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="toc" aria-label="本页目录">
      <h2>本页目录</h2>
      <ol>
        {headings.map((heading) => (
          <li key={heading.anchor} data-level={heading.level}>
            <a
              className={active === heading.anchor ? 'active' : undefined}
              href={`#/wiki/${encodeURIComponent(slug)}#${encodeURIComponent(heading.anchor)}`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

