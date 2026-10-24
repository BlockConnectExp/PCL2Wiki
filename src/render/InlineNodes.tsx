import type { ReactNode } from 'react';
import type { InlineNode } from '../core/types';
import { MathValue } from './MathValue';
import type { RenderContext } from './context';

function wikiHref(slug: string, anchor: string | undefined, currentSlug: string): string {
  const targetSlug = slug || currentSlug;
  const suffix = anchor ? `#${encodeURIComponent(anchor)}` : '';
  return `#/wiki/${encodeURIComponent(targetSlug)}${suffix}`;
}

function renderNode(node: InlineNode, key: number, context: RenderContext): ReactNode {
  switch (node.type) {
    case 'text':
      return node.value;
    case 'strong':
      return (
        <strong key={key}>
          <InlineNodes nodes={node.children} context={context} />
        </strong>
      );
    case 'em':
      return (
        <em key={key}>
          <InlineNodes nodes={node.children} context={context} />
        </em>
      );
    case 'del':
      return (
        <del key={key}>
          <InlineNodes nodes={node.children} context={context} />
        </del>
      );
    case 'code':
      return <code key={key}>{node.value}</code>;
    case 'link': {
      const isSpecial = /^(https?:|mailto:|data:|#)/i.test(node.href) || node.href === '';
      const href = node.target
        ? wikiHref(node.target.slug, node.target.anchor, context.slug)
        : isSpecial
          ? node.href
          : context.resolveAsset(node.href);
      const external = /^https?:/i.test(href);
      return (
        <a
          key={key}
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noreferrer noopener' : undefined}
        >
          <InlineNodes nodes={node.children} context={context} />
        </a>
      );
    }
    case 'image':
      return (
        <img
          key={key}
          className="inline-image"
          src={context.resolveAsset(node.src)}
          alt={node.alt}
          title={node.title}
          loading="lazy"
        />
      );
    case 'math':
      return <MathValue key={key} value={node.value} display={false} />;
    case 'br':
      return <br key={key} />;
    case 'ref':
      return (
        <sup key={key} className="ref-marker">
          <a href={wikiHref(context.slug, `ref-${node.to}`, context.slug)}>[{node.to}]</a>
        </sup>
      );
    default:
      return null;
  }
}

export function InlineNodes({ nodes, context }: { nodes: InlineNode[]; context: RenderContext }) {
  return <>{nodes.map((node, index) => renderNode(node, index, context))}</>;
}

