export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export interface Diagnostic {
  code: string;
  severity: DiagnosticSeverity;
  message: string;
  tag?: string;
  line?: number;
}

export interface LinkTarget {
  slug: string;
  anchor?: string;
}

export type InlineNode =
  | { type: 'text'; value: string }
  | { type: 'strong'; children: InlineNode[] }
  | { type: 'em'; children: InlineNode[] }
  | { type: 'del'; children: InlineNode[] }
  | { type: 'code'; value: string }
  | { type: 'link'; href: string; target?: LinkTarget; children: InlineNode[] }
  | { type: 'image'; src: string; alt: string; title?: string }
  | { type: 'math'; value: string }
  | { type: 'br' }
  | { type: 'ref'; to: string };

export interface TableRow {
  header: boolean;
  cells: InlineNode[][];
}

export type MediaKind = 'image' | 'video' | 'audio' | 'file';

export type NoteKind = 'note' | 'tip' | 'warning' | 'danger' | 'important';

export type BlockNode =
  | { type: 'section'; title: string; anchor: string; children: BlockNode[] }
  | { type: 'heading'; level: 2 | 3 | 4 | 5 | 6; anchor: string; children: InlineNode[] }
  | { type: 'paragraph'; children: InlineNode[] }
  | { type: 'list'; ordered: boolean; items: InlineNode[][] }
  | { type: 'code'; language?: string; title?: string; value: string }
  | { type: 'table'; caption?: string; rows: TableRow[] }
  | { type: 'media'; kind: MediaKind; src: string; caption?: string; alt?: string }
  | { type: 'math'; value: string; display: boolean }
  | { type: 'quote'; source?: string; children: BlockNode[] }
  | {
      type: 'infobox';
      fields: { label: string; value: InlineNode[] }[];
      image?: { src: string; caption?: string };
    }
  | { type: 'seealso'; items: { slug: string; title?: string }[] }
  | { type: 'references'; items: { id: string; children: InlineNode[] }[] }
  | { type: 'note'; kind: NoteKind; children: BlockNode[] }
  | { type: 'details'; summary: string; children: BlockNode[] }
  | {
      type: 'gallery';
      items: { src: string; caption?: string; alt?: string; id?: string; label?: string }[];
    }
  | { type: 'hr' }
  | { type: 'diagnostic'; diagnostic: Diagnostic };

export interface WikiMeta {
  slug: string;
  title: string;
  lang: string;
  tags: string[];
  summary?: string;
  updated?: string;
  version?: string;
}

export interface HeadingEntry {
  anchor: string;
  text: string;
  level: number;
}

export interface WikiDocument {
  meta: WikiMeta;
  blocks: BlockNode[];
  diagnostics: Diagnostic[];
  headings: HeadingEntry[];
}

export interface ArticleIndexEntry {
  slug: string;
  title: string;
  packageId: string;
  source: string;
  tags: string[];
  updated?: string;
  summary?: string;
  language?: string;
}

export interface ContentPackageEntry {
  id: string;
  title: string;
  version: string;
  language?: string;
  entry?: string;
}

export interface ContentIndex {
  spec: string;
  generatedAt?: string;
  packages: ContentPackageEntry[];
  articles: ArticleIndexEntry[];
}

export interface PackageArticle {
  slug: string;
  title: string;
  source: string;
  tags?: string[];
  updated?: string;
  summary?: string;
}

export interface PackageAsset {
  path: string;
  sha256: string;
  bytes: number;
  mime: string;
}

export interface PackageManifest {
  spec: 'pcl2wiki-package/1';
  id: string;
  title: string;
  version: string;
  language: string;
  entry?: string;
  articles: PackageArticle[];
  assets?: PackageAsset[];
  generator?: string;
  createdAt?: string;
  description?: string;
}

