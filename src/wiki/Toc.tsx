import type { HeadingEntry } from '../core/types';

export function Toc({ headings, slug }: { headings: HeadingEntry[]; slug: string }) {
  if (headings.length === 0) return null;

  return (
    <nav className="toc" aria-label="本页目录">
      <h2>本页目录</h2>
      <ol>
        {headings.map((heading) => (
          <li key={heading.anchor} data-level={heading.level}>
            <a href={`#/wiki/${encodeURIComponent(slug)}#${encodeURIComponent(heading.anchor)}`}>
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

