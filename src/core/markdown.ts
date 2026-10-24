import { Marked } from 'marked';
import { collectHeadings } from './headings';
import { createAnchorRegistry, normalizeXmlText, slugify } from './text';
import type {
  BlockNode,
  Diagnostic,
  InlineNode,
  LinkTarget,
  TableRow,
  WikiDocument,
  WikiMeta,
} from './types';

const marked = new Marked({ gfm: true, breaks: false });

interface MarkdownToken {
  type: string;
  raw?: string;
  text?: string;
  href?: string;
  title?: string | null;
  lang?: string;
  depth?: number;
  ordered?: boolean;
  items?: MarkdownToken[];
  tokens?: MarkdownToken[];
  header?: MarkdownToken[];
  rows?: MarkdownToken[][];
}

function tokenize(source: string): MarkdownToken[] {
  return marked.lexer(source) as unknown as MarkdownToken[];
}

function flattenParagraphTokens(tokens: MarkdownToken[]): MarkdownToken[] {
  const flattened: MarkdownToken[] = [];

  for (const token of tokens) {
    if (token.type === 'space' || token.type === 'def') continue;
    if (token.type === 'paragraph') {
      flattened.push(...(token.tokens ?? []));
      continue;
    }
    flattened.push(token);
  }

  return flattened;
}

function extractMath(source: string): { text: string; values: string[] } {
  const values: string[] = [];
  const text = source.replace(/\$([^$\n]+)\$/g, (_match, expression: string) => {
    const index = values.push(expression) - 1;
    return `\uE000M${index}\uE000`;
  });

  return { text, values };
}

function textTokenToInline(value: string, mathValues: string[]): InlineNode[] {
  const parts = value.split(/\uE000M(\d+)\uE000/g);
  const nodes: InlineNode[] = [];

  parts.forEach((part, index) => {
    if (index % 2 === 1) {
      const expression = mathValues[Number(part)];
      if (expression) nodes.push({ type: 'math', value: expression });
      return;
    }
    if (part) nodes.push({ type: 'text', value: part });
  });

  return nodes;
}

function resolveLinkTarget(href: string): { href: string; target?: LinkTarget } {
  if (href.startsWith('mcwiki:')) {
    const raw = href.slice('mcwiki:'.length);
    const [slug, anchor] = raw.split('#');
    return { href: '', target: { slug: slug.trim(), anchor: anchor?.trim() || undefined } };
  }

  if (href.startsWith('#')) {
    return { href: '', target: { slug: '', anchor: href.slice(1) } };
  }

  const isExternal = /^(https?:|mailto:)/i.test(href);
  if (isExternal) return { href };

  const fileMatch = href.match(/^\.?\/?([^/?#]+)\.(md|xaml)(?:#(.+))?$/i);
  if (fileMatch) {
    return {
      href: '',
      target: { slug: fileMatch[1], anchor: fileMatch[3] || undefined },
    };
  }

  return { href };
}

function mapInlineTokens(tokens: MarkdownToken[], mathValues: string[]): InlineNode[] {
  const nodes: InlineNode[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case 'text':
        nodes.push(...textTokenToInline(token.text ?? token.raw ?? '', mathValues));
        break;
      case 'escape':
        nodes.push({ type: 'text', value: token.text ?? '' });
        break;
      case 'strong':
        nodes.push({
          type: 'strong',
          children: mapInlineTokens(token.tokens ?? [], mathValues),
        });
        break;
      case 'em':
        nodes.push({ type: 'em', children: mapInlineTokens(token.tokens ?? [], mathValues) });
        break;
      case 'del':
        nodes.push({ type: 'del', children: mapInlineTokens(token.tokens ?? [], mathValues) });
        break;
      case 'codespan':
        nodes.push({ type: 'code', value: token.text ?? '' });
        break;
      case 'br':
        nodes.push({ type: 'br' });
        break;
      case 'link': {
        const resolved = resolveLinkTarget(token.href ?? '');
        nodes.push({
          type: 'link',
          href: resolved.href,
          target: resolved.target,
          children: mapInlineTokens(token.tokens ?? [], mathValues),
        });
        break;
      }
      case 'image':
        nodes.push({
          type: 'image',
          src: token.href ?? '',
          alt: token.text ?? '',
          title: token.title ?? undefined,
        });
        break;
      case 'html':
        nodes.push({ type: 'text', value: token.raw ?? '' });
        break;
      default:
        if (token.tokens) {
          nodes.push(...mapInlineTokens(token.tokens, mathValues));
        } else {
          nodes.push({ type: 'text', value: token.raw ?? token.text ?? '' });
        }
    }
  }

  return nodes;
}

export function parseInlineMarkdown(source: string): InlineNode[] {
  const normalized = normalizeXmlText(source);
  if (!normalized) return [];

  const withWikiLinks = normalized.replace(
    /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
    (_match, rawTarget: string, rawLabel?: string) => {
      const target = rawTarget.trim();
      const label = rawLabel?.trim() || target;
      return `[${label}](mcwiki:${target})`;
    },
  );

  const { text, values } = extractMath(withWikiLinks);
  const tokens = flattenParagraphTokens(tokenize(text));
  return mapInlineTokens(tokens, values);
}

function mapBlockTokens(
  tokens: MarkdownToken[],
  diagnostics: Diagnostic[],
  anchors: (input: string) => string,
): BlockNode[] {
  const blocks: BlockNode[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case 'heading': {
        const text = token.text ?? '';
        blocks.push({
          type: 'heading',
          level: Math.min(6, Math.max(3, token.depth ?? 3)) as 3 | 4 | 5 | 6,
          anchor: anchors(text),
          children: parseInlineMarkdown(text),
        });
        break;
      }
      case 'paragraph': {
        const raw = token.raw ?? token.text ?? '';
        const mathBlock = raw.match(/^\s*\$\$([\s\S]+?)\$\$\s*$/);
        if (mathBlock) {
          blocks.push({ type: 'math', value: mathBlock[1].trim(), display: true });
        } else {
          const children = parseInlineMarkdown(token.text ?? '');
          const onlyImage = children.length === 1 && children[0]?.type === 'image';
          if (onlyImage) {
            const image = children[0] as Extract<InlineNode, { type: 'image' }>;
            blocks.push({
              type: 'media',
              kind: 'image',
              src: image.src,
              alt: image.alt || undefined,
              caption: image.title || undefined,
            });
          } else {
            blocks.push({ type: 'paragraph', children });
          }
        }
        break;
      }
      case 'list':
        blocks.push({
          type: 'list',
          ordered: Boolean(token.ordered),
          items: (token.items ?? []).map((item) => parseInlineMarkdown(item.text ?? '')),
        });
        break;
      case 'code':
        blocks.push({
          type: 'code',
          language: token.lang || undefined,
          value: token.text ?? '',
        });
        break;
      case 'table': {
        const rows: TableRow[] = [];
        if (token.header) {
          rows.push({
            header: true,
            cells: token.header.map((cell) => parseInlineMarkdown(cell.text ?? '')),
          });
        }
        for (const row of token.rows ?? []) {
          rows.push({
            header: false,
            cells: row.map((cell) => parseInlineMarkdown(cell.text ?? '')),
          });
        }
        blocks.push({ type: 'table', rows });
        break;
      }
      case 'blockquote':
        blocks.push({
          type: 'quote',
          children: mapBlockTokens(token.tokens ?? [], diagnostics, anchors),
        });
        break;
      case 'hr':
        blocks.push({ type: 'hr' });
        break;
      case 'html':
        diagnostics.push({
          code: 'MD002',
          severity: 'warning',
          message: 'Markdown 中的原始 HTML 已按纯文本处理',
        });
        break;
      case 'space':
      case 'def':
        break;
      default:
        if (token.tokens) {
          blocks.push(...mapBlockTokens(token.tokens, diagnostics, anchors));
        } else if (token.text) {
          blocks.push({ type: 'paragraph', children: parseInlineMarkdown(token.text) });
        }
    }
  }

  return blocks;
}

export function parseMarkdownBlocks(source: string, diagnostics: Diagnostic[] = []): BlockNode[] {
  return mapBlockTokens(tokenize(source), diagnostics, createAnchorRegistry());
}

function parseFrontmatter(source: string): { data: Record<string, string>; body: string } {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { data: {}, body: source };

  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator <= 0) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    data[key] = value;
  }

  return { data, body: source.slice(match[0].length) };
}

function parseTagList(value?: string): string[] {
  if (!value) return [];
  return value
    .replace(/^\[|\]$/g, '')
    .split(/[,，]/)
    .map((tag) => tag.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

export function parseMarkdownArticle(source: string, fallbackSlug: string): WikiDocument {
  const { data, body } = parseFrontmatter(source);
  const diagnostics: Diagnostic[] = [];
  const blocks = parseMarkdownBlocks(body, diagnostics);
  const meta: WikiMeta = {
    slug: (data.slug || fallbackSlug || slugify(data.title || 'article')).trim(),
    title: (data.title || fallbackSlug || '未命名文稿').trim(),
    lang: (data.lang || 'zh-CN').trim(),
    tags: parseTagList(data.tags),
    summary: data.summary,
    updated: data.updated,
  };

  return { meta, blocks, diagnostics, headings: collectHeadings(blocks) };
}

