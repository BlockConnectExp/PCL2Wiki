import type { BlockNode } from '../core/types';
import { useEffect, useRef, useState } from 'react';
import { InlineNodes } from './InlineNodes';
import { MathValue } from './MathValue';
import type { RenderContext } from './context';

type GalleryItem = Extract<BlockNode, { type: 'gallery' }>['items'][number];

function GalleryBanner({ items, context }: { items: GalleryItem[]; context: RenderContext }) {
  const wrapperRef = useRef<HTMLElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!wrapper || !viewport || !track) return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let distance = 0;
    let wrapperTop = 0;

    const measure = () => {
      const canPin = items.length >= 3 && window.innerWidth >= 720 && !motion.matches;
      if (!canPin) {
        setPinned(false);
        wrapper.style.height = '';
        track.style.transform = '';
        distance = 0;
        return;
      }
      setPinned(true);
      const pinHeight = Math.min(window.innerHeight * 0.62, 520);
      viewport.style.setProperty('--gallery-pin-height', `${pinHeight}px`);
      distance = Math.max(0, track.scrollWidth - viewport.clientWidth);
      wrapper.style.height = `${pinHeight + distance}px`;
      wrapperTop = window.scrollY + wrapper.getBoundingClientRect().top;
    };

    const update = () => {
      if (!distance) return;
      const progress = Math.min(1, Math.max(0, (window.scrollY - wrapperTop) / distance));
      track.style.transform = `translate3d(${(-progress * distance).toFixed(2)}px, 0, 0)`;
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    const onResize = () => {
      measure();
      update();
    };

    measure();
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    const observer = new ResizeObserver(onResize);
    observer.observe(track);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      wrapper.style.height = '';
      track.style.transform = '';
    };
  }, [items.length]);

  return (
    <section
      ref={wrapperRef}
      className={`gallery-banner${pinned ? ' is-pinned' : ''}`}
      aria-label="图片画廊"
    >
      <div ref={viewportRef} className="gallery-banner__viewport">
        <div ref={trackRef} className="gallery-banner__track">
          {items.map((item, index) => (
            <figure
              key={index}
              className="gallery-banner__item"
              id={item.id ? `gallery-${item.id}` : undefined}
            >
              <img
                src={context.resolveAsset(item.src)}
                alt={item.alt ?? item.caption ?? ''}
                loading="lazy"
              />
              {(item.label || item.caption) && (
                <figcaption>
                  {item.label && <span className="gallery-banner__label">{item.label}</span>}
                  {item.caption && <span>{item.caption}</span>}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function headingHref(slug: string, anchor: string): string {
  return `#/wiki/${encodeURIComponent(slug)}#${encodeURIComponent(anchor)}`;
}

function renderBlock(block: BlockNode, key: number, context: RenderContext) {
  switch (block.type) {
    case 'section':
      return (
        <section key={key} id={block.anchor} className="wiki-section">
          <h2>
            {block.title}
            <a className="heading-anchor" href={headingHref(context.slug, block.anchor)} aria-label="章节链接">
              #
            </a>
          </h2>
          <Blocks blocks={block.children} context={context} />
        </section>
      );
    case 'heading': {
      const Tag = `h${block.level}` as 'h3' | 'h4' | 'h5' | 'h6';
      return (
        <Tag key={key} id={block.anchor} className="wiki-subheading">
          <InlineNodes nodes={block.children} context={context} />
          <a className="heading-anchor" href={headingHref(context.slug, block.anchor)} aria-label="章节链接">
            #
          </a>
        </Tag>
      );
    }
    case 'paragraph':
      return (
        <p key={key}>
          <InlineNodes nodes={block.children} context={context} />
        </p>
      );
    case 'list':
      return block.ordered ? (
        <ol key={key} className="wiki-list">
          {block.items.map((item, index) => (
            <li key={index}>
              <InlineNodes nodes={item} context={context} />
            </li>
          ))}
        </ol>
      ) : (
        <ul key={key} className="wiki-list">
          {block.items.map((item, index) => (
            <li key={index}>
              <InlineNodes nodes={item} context={context} />
            </li>
          ))}
        </ul>
      );
    case 'code':
      return (
        <figure key={key} className="code-block">
          {block.title && <figcaption>{block.title}</figcaption>}
          <pre>
            <code className={block.language ? `language-${block.language}` : undefined}>
              {block.value}
            </code>
          </pre>
        </figure>
      );
    case 'table':
      return (
        <div key={key} className="table-wrap">
          <table>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className={row.header ? 'table-head' : undefined}>
                  {row.cells.map((cell, cellIndex) =>
                    row.header ? (
                      <th key={cellIndex}>
                        <InlineNodes nodes={cell} context={context} />
                      </th>
                    ) : (
                      <td key={cellIndex}>
                        <InlineNodes nodes={cell} context={context} />
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'media': {
      const src = context.resolveAsset(block.src);
      if (block.kind === 'video') {
        return (
          <figure key={key} className="media-block">
            <video src={src} controls preload="metadata" />
            {block.caption && <figcaption>{block.caption}</figcaption>}
          </figure>
        );
      }
      if (block.kind === 'audio') {
        return (
          <figure key={key} className="media-block">
            <audio src={src} controls preload="metadata" />
            {block.caption && <figcaption>{block.caption}</figcaption>}
          </figure>
        );
      }
      if (block.kind === 'file') {
        return (
          <p key={key}>
            <a className="download-link" href={src} download>
              {block.caption || block.alt || block.src}
            </a>
          </p>
        );
      }
      return (
        <figure key={key} className="media-block">
          <img src={src} alt={block.alt ?? block.caption ?? ''} loading="lazy" />
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      );
    }
    case 'math':
      return <MathValue key={key} value={block.value} display={block.display} />;
    case 'quote':
      return (
        <blockquote key={key}>
          <Blocks blocks={block.children} context={context} />
          {block.source && <footer>{block.source}</footer>}
        </blockquote>
      );
    case 'seealso':
      return (
        <nav key={key} className="see-also" aria-label="参见">
          <h2>参见</h2>
          <ul>
            {block.items.map((item) => (
              <li key={item.slug}>
                <a href={`#/wiki/${encodeURIComponent(item.slug)}`}>{item.title || item.slug}</a>
              </li>
            ))}
          </ul>
        </nav>
      );
    case 'references':
      return (
        <section key={key} className="references">
          <h2>参考文献</h2>
          <ol>
            {block.items.map((item) => (
              <li key={item.id} id={`ref-${item.id}`}>
                <InlineNodes nodes={item.children} context={context} />
              </li>
            ))}
          </ol>
        </section>
      );
    case 'note':
      return (
        <aside key={key} className={`note note-${block.kind}`}>
          <Blocks blocks={block.children} context={context} />
        </aside>
      );
    case 'details':
      return (
        <details key={key} className="wiki-details">
          <summary>{block.summary}</summary>
          <Blocks blocks={block.children} context={context} />
        </details>
      );
    case 'gallery':
      return <GalleryBanner key={key} items={block.items} context={context} />;
    case 'hr':
      return <hr key={key} />;
    case 'diagnostic':
      return (
        <aside key={key} className="diagnostic-block">
          <code>{block.diagnostic.code}</code> {block.diagnostic.message}
        </aside>
      );
    default:
      return null;
  }
}

export function Blocks({ blocks, context }: { blocks: BlockNode[]; context: RenderContext }) {
  return <>{blocks.map((block, index) => renderBlock(block, index, context))}</>;
}

export function ArticleInfobox({ block, context }: { block: BlockNode; context: RenderContext }) {
  if (block.type !== 'infobox') return null;

  return (
    <aside className="infobox">
      {block.image && (
        <img
          className="infobox-image"
          src={context.resolveAsset(block.image.src)}
          alt={block.image.caption ?? ''}
          loading="lazy"
        />
      )}
      <table>
        <tbody>
          {block.fields.map((field, index) => (
            <tr key={index}>
              <th>{field.label}</th>
              <td>
                <InlineNodes nodes={field.value} context={context} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </aside>
  );
}

