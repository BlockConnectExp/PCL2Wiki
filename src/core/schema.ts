export const WIKI_NS = 'https://pcl2.n0th1n3ssd0ma1n.top/schema/1';
export const MD_NS = 'https://pcl2.n0th1n3ssd0ma1n.top/markdown/1';

export const KNOWN_BLOCK_TAGS = new Set([
  'Article',
  'Infobox',
  'Infobox.Field',
  'Infobox.Image',
  'Section',
  'Paragraph',
  'Heading',
  'List',
  'ListItem',
  'CodeBlock',
  'Table',
  'TableRow',
  'TableCell',
  'Media',
  'Math',
  'Quote',
  'SeeAlso',
  'Link',
  'References',
  'Ref',
  'Note',
  'Details',
  'Summary',
  'Gallery',
]);

export function isMdElement(element: Element, localName?: string): boolean {
  const matchesName = localName ? element.localName === localName : true;
  return matchesName && (element.prefix === 'md' || element.namespaceURI === MD_NS);
}

export function isTruthyAttribute(value: string | null): boolean {
  if (value === null) return false;
  return !['false', '0', 'no', 'off'].includes(value.trim().toLowerCase());
}

