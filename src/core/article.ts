import { parseMarkdownArticle } from './markdown';
import { parseWikiXaml } from './xaml';
import type { ArticleIndexEntry, WikiDocument } from './types';

export function detectFormat(source: string): 'xaml' | 'md' {
  return source.toLowerCase().endsWith('.md') ? 'md' : 'xaml';
}

export function parseArticle(source: string, entry: ArticleIndexEntry): WikiDocument {
  return detectFormat(entry.source) === 'md'
    ? parseMarkdownArticle(source, entry.slug)
    : parseWikiXaml(source, entry.slug);
}

