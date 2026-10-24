import { collectHeadings } from './headings';
import { parseInlineMarkdown, parseMarkdownBlocks } from './markdown';
import { isMdElement, isTruthyAttribute, MD_NS, WIKI_NS } from './schema';
import { createAnchorRegistry, normalizeXmlText, slugify, stripSingleNewline } from './text';
import type {
  BlockNode,
  Diagnostic,
  InlineNode,
  MediaKind,
  NoteKind,
  TableRow,
  WikiDocument,
  WikiMeta,
} from './types';

interface ParseContext {
  diagnostics: Diagnostic[];
  anchors: (input: string) => string;
}

function warning(context: ParseContext, code: string, message: string, tag?: string): void {
  context.diagnostics.push({ code, severity: 'warning', message, tag });
}

function error(context: ParseContext, code: string, message: string, tag?: string): void {
  context.diagnostics.push({ code, severity: 'error', message, tag });
}

function childElements(element: Element): Element[] {
  return Array.from(element.children);
}

function inlineFromText(element: Element): InlineNode[] {
  const parseMode =
    element.getAttribute('md:parse') ?? element.getAttributeNS(MD_NS, 'parse') ?? '';
  if (parseMode.toLowerCase() === 'off') {
    return [{ type: 'text', value: normalizeXmlText(element.textContent ?? '') }];
  }
  return parseInlineMarkdown(element.textContent ?? '');
}

function inferMediaKind(src: string, explicit?: string | null): MediaKind {
  if (explicit === 'image' || explicit === 'video' || explicit === 'audio' || explicit === 'file') {
    return explicit;
  }
  if (/\.(png|jpe?g|webp|gif|avif|svg)$/i.test(src)) return 'image';
  if (/\.(mp4|webm|mov)$/i.test(src)) return 'video';
  if (/\.(mp3|ogg|wav|m4a)$/i.test(src)) return 'audio';
  return 'file';
}

function parseInfobox(element: Element, context: ParseContext): BlockNode {
  const fields: { label: string; value: InlineNode[] }[] = [];
  let image: { src: string; caption?: string } | undefined;

  for (const child of childElements(element)) {
    if (child.localName === 'Infobox.Field') {
      const label = child.getAttribute('label') ?? '';
      if (!label) warning(context, 'SCH002', '<Infobox.Field> 缺少 label 属性', child.localName);
      fields.push({ label, value: inlineFromText(child) });
    } else if (child.localName === 'Infobox.Image') {
      const src = child.getAttribute('src') ?? '';
      if (!src) warning(context, 'SCH002', '<Infobox.Image> 缺少 src 属性', child.localName);
      image = { src, caption: child.getAttribute('caption') ?? undefined };
    } else {
      warning(context, 'SCH004', `<Infobox> 中不支持 <${child.localName}>`, child.localName);
    }
  }

  return { type: 'infobox', fields, image };
}

function parseSection(element: Element, context: ParseContext): BlockNode {
  const explicitTitle = element.getAttribute('title');
  const title = explicitTitle || '未命名章节';
  if (!explicitTitle) warning(context, 'SCH002', '<Section> 缺少 title 属性', 'Section');

  const anchor = context.anchors(element.getAttribute('id') || title);
  return { type: 'section', title, anchor, children: parseBlocks(element, context) };
}

function parseHeading(element: Element, context: ParseContext): BlockNode {
  const rawLevel = Number(element.getAttribute('level') ?? '3');
  const level = Math.min(6, Math.max(3, Number.isFinite(rawLevel) ? rawLevel : 3)) as 3 | 4 | 5 | 6;
  const children = inlineFromText(element);
  const text = children.map((child) => ('value' in child ? child.value : '')).join('');
  return { type: 'heading', level, anchor: context.anchors(element.getAttribute('id') || text), children };
}

function parseList(element: Element, context: ParseContext): BlockNode {
  const type = (element.getAttribute('type') ?? 'unordered').toLowerCase();
  const ordered = type === 'ordered' || type === 'number';
  const items: InlineNode[][] = [];

  for (const child of childElements(element)) {
    if (child.localName !== 'ListItem') {
      warning(context, 'SCH004', `<List> 中不支持 <${child.localName}>`, child.localName);
      continue;
    }
    items.push(inlineFromText(child));
  }

  return { type: 'list', ordered, items };
}

function parseTable(element: Element, context: ParseContext): BlockNode {
  const rows: TableRow[] = [];

  for (const rowElement of childElements(element)) {
    if (rowElement.localName !== 'TableRow') {
      warning(context, 'SCH004', `<Table> 中不支持 <${rowElement.localName}>`, rowElement.localName);
      continue;
    }

    const header = isTruthyAttribute(rowElement.getAttribute('header'));
    const cells: InlineNode[][] = [];
    for (const cellElement of childElements(rowElement)) {
      if (cellElement.localName !== 'TableCell') {
        warning(context, 'SCH004', `<TableRow> 中不支持 <${cellElement.localName}>`, cellElement.localName);
        continue;
      }
      cells.push(inlineFromText(cellElement));
    }
    rows.push({ header, cells });
  }

  return { type: 'table', rows };
}

function parseQuote(element: Element, context: ParseContext): BlockNode {
  const children = childElements(element).length
    ? parseBlocks(element, context)
    : [{ type: 'paragraph' as const, children: inlineFromText(element) }];

  return { type: 'quote', source: element.getAttribute('source') ?? undefined, children };
}

function parseSeeAlso(element: Element, context: ParseContext): BlockNode {
  const items: { slug: string; title?: string }[] = [];

  for (const child of childElements(element)) {
    if (child.localName !== 'Link') {
      warning(context, 'SCH004', `<SeeAlso> 中不支持 <${child.localName}>`, child.localName);
      continue;
    }
    const slug = child.getAttribute('slug') || child.getAttribute('to') || '';
    if (!slug) {
      warning(context, 'SCH002', '<SeeAlso> 中的 <Link> 缺少 slug', 'Link');
      continue;
    }
    items.push({ slug, title: child.getAttribute('title') ?? undefined });
  }

  return { type: 'seealso', items };
}

function parseReferences(element: Element, context: ParseContext): BlockNode {
  const items: { id: string; children: InlineNode[] }[] = [];

  for (const child of childElements(element)) {
    if (child.localName !== 'Ref') {
      warning(context, 'SCH004', `<References> 中不支持 <${child.localName}>`, child.localName);
      continue;
    }
    const id = child.getAttribute('id') ?? '';
    if (!id) warning(context, 'SCH002', '<Ref> 缺少 id 属性', 'Ref');
    items.push({ id, children: inlineFromText(child) });
  }

  return { type: 'references', items };
}

function parseNote(element: Element, context: ParseContext): BlockNode {
  const rawKind = (element.getAttribute('type') ?? 'note').toLowerCase();
  const kind: NoteKind = ['note', 'tip', 'warning', 'danger', 'important'].includes(rawKind)
    ? (rawKind as NoteKind)
    : 'note';
  return { type: 'note', kind, children: parseBlocks(element, context) };
}

function parseDetails(element: Element, context: ParseContext): BlockNode {
  const summaryElement = childElements(element).find((child) => child.localName === 'Summary');
  const summary = element.getAttribute('summary') || summaryElement?.textContent?.trim() || '详情';
  const children = parseBlocks(element, context).filter(
    (child) => child.type !== 'paragraph' || child.children.length > 0,
  );
  return { type: 'details', summary, children };
}

function parseGallery(element: Element, context: ParseContext): BlockNode {
  const items: { src: string; caption?: string; alt?: string }[] = [];

  for (const child of childElements(element)) {
    if (child.localName !== 'Media') {
      warning(context, 'SCH004', `<Gallery> 中不支持 <${child.localName}>`, child.localName);
      continue;
    }
    const src = child.getAttribute('src') ?? '';
    if (!src) {
      warning(context, 'SCH002', '<Media> 缺少 src 属性', 'Media');
      continue;
    }
    items.push({
      src,
      caption: child.getAttribute('caption') ?? undefined,
      alt: child.getAttribute('alt') ?? undefined,
    });
  }

  return { type: 'gallery', items };
}

function parseMedia(element: Element, context: ParseContext): BlockNode {
  const src = element.getAttribute('src') ?? '';
  if (!src) warning(context, 'SCH002', '<Media> 缺少 src 属性', 'Media');
  return {
    type: 'media',
    kind: inferMediaKind(src, element.getAttribute('type')),
    src,
    caption: element.getAttribute('caption') ?? undefined,
    alt: element.getAttribute('alt') ?? undefined,
  };
}

function parseMath(element: Element): BlockNode {
  const display = isTruthyAttribute(element.getAttribute('display')) || element.getAttribute('display') === 'block';
  return { type: 'math', value: element.textContent?.trim() ?? '', display };
}

function parseCodeBlock(element: Element): BlockNode {
  return {
    type: 'code',
    language: (element.getAttribute('language') || element.getAttribute('lang') || '').trim() || undefined,
    title: element.getAttribute('title') ?? undefined,
    value: stripSingleNewline(element.textContent ?? ''),
  };
}

function parseBlocks(parent: Element, context: ParseContext): BlockNode[] {
  const blocks: BlockNode[] = [];

  for (const child of childElements(parent)) {
    if (isMdElement(child, 'Block')) {
      blocks.push(...parseMarkdownBlocks(child.textContent ?? '', context.diagnostics));
      continue;
    }

    switch (child.localName) {
      case 'Infobox':
        blocks.push(parseInfobox(child, context));
        break;
      case 'Section':
        blocks.push(parseSection(child, context));
        break;
      case 'Paragraph':
        blocks.push({ type: 'paragraph', children: inlineFromText(child) });
        break;
      case 'Heading':
        blocks.push(parseHeading(child, context));
        break;
      case 'List':
        blocks.push(parseList(child, context));
        break;
      case 'CodeBlock':
        blocks.push(parseCodeBlock(child));
        break;
      case 'Table':
        blocks.push(parseTable(child, context));
        break;
      case 'Media':
        blocks.push(parseMedia(child, context));
        break;
      case 'Math':
        blocks.push(parseMath(child));
        break;
      case 'Quote':
        blocks.push(parseQuote(child, context));
        break;
      case 'SeeAlso':
        blocks.push(parseSeeAlso(child, context));
        break;
      case 'References':
        blocks.push(parseReferences(child, context));
        break;
      case 'Note':
        blocks.push(parseNote(child, context));
        break;
      case 'Details':
        blocks.push(parseDetails(child, context));
        break;
      case 'Gallery':
        blocks.push(parseGallery(child, context));
        break;
      case 'Summary':
        break;
      default: {
        warning(context, 'SCH001', `未知标签 <${child.localName}>，已跳过`, child.localName);
        blocks.push({
          type: 'diagnostic',
          diagnostic: {
            code: 'SCH001',
            severity: 'warning',
            message: `未知标签 <${child.localName}>`,
            tag: child.localName,
          },
        });
      }
    }
  }

  for (const node of Array.from(parent.childNodes)) {
    if (node.nodeType !== 1 && node.textContent && node.textContent.trim()) {
      blocks.push({ type: 'paragraph', children: parseInlineMarkdown(node.textContent) });
    }
  }

  return blocks;
}

function parseMeta(root: Element, fallbackSlug: string, context: ParseContext): WikiMeta {
  const title = (root.getAttribute('title') || '').trim() || fallbackSlug || '未命名文稿';
  const slug = (root.getAttribute('slug') || fallbackSlug || slugify(title)).trim();
  const tags = (root.getAttribute('tags') ?? '')
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (!root.getAttribute('title')) warning(context, 'SCH002', '<Article> 缺少 title 属性', 'Article');
  if (!root.getAttribute('slug')) warning(context, 'SCH002', '<Article> 缺少 slug 属性', 'Article');

  return {
    slug,
    title,
    lang: (root.getAttribute('lang') || 'zh-CN').trim(),
    tags,
    summary: root.getAttribute('summary') ?? undefined,
    updated: root.getAttribute('updated') ?? undefined,
    version: root.getAttribute('version') ?? undefined,
  };
}

export function parseWikiXaml(source: string, fallbackSlug = 'article'): WikiDocument {
  const context: ParseContext = { diagnostics: [], anchors: createAnchorRegistry() };
  const dom = new DOMParser().parseFromString(source, 'application/xml');
  const parserError = dom.getElementsByTagName('parsererror')[0];

  if (parserError) {
    const message = normalizeXmlText(parserError.textContent ?? 'XML 解析失败');
    const line = message.match(/line\s+(\d+)/i)?.[1];
    context.diagnostics.push({
      code: 'XML001',
      severity: 'error',
      message,
      line: line ? Number(line) : undefined,
    });
    return {
      meta: { slug: fallbackSlug, title: fallbackSlug, lang: 'zh-CN', tags: [] },
      blocks: [],
      diagnostics: context.diagnostics,
      headings: [],
    };
  }

  const root = dom.documentElement;
  if (root.localName.toLowerCase() !== 'article') {
    error(context, 'SCH004', `根元素必须是 <Article>，实际为 <${root.localName}>`, root.localName);
  } else if (root.localName !== 'Article') {
    warning(context, 'SCH000', '根元素建议使用 <Article>', root.localName);
  }
  if (root.namespaceURI && root.namespaceURI !== WIKI_NS) {
    warning(
      context,
      'SCH000',
      `命名空间为 ${root.namespaceURI}，当前规范命名空间为 ${WIKI_NS}`,
      root.localName,
    );
  }

  const blocks = parseBlocks(root, context);
  const meta = parseMeta(root, fallbackSlug, context);

  return { meta, blocks, diagnostics: context.diagnostics, headings: collectHeadings(blocks) };
}

