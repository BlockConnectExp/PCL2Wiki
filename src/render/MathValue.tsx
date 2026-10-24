import { useEffect, useState } from 'react';
import 'katex/dist/katex.min.css';

let katexPromise: Promise<typeof import('katex')> | null = null;

function loadKatex() {
  katexPromise ??= import('katex');
  return katexPromise;
}

export function MathValue({ value, display }: { value: string; display: boolean }) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    let alive = true;
    void loadKatex()
      .then((module) => {
        if (!alive) return;
        setHtml(module.default.renderToString(value, { throwOnError: false, displayMode: display }));
      })
      .catch(() => {
        if (alive) setHtml('');
      });
    return () => {
      alive = false;
    };
  }, [display, value]);

  if (!html) {
    return <code className="math-fallback">{value}</code>;
  }

  return display ? (
    <div className="math-display" dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <span className="math-inline" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

