import type { BlockNode, HeadingEntry } from './types';

export function collectHeadings(blocks: BlockNode[]): HeadingEntry[] {
  const headings: HeadingEntry[] = [];

  const walk = (nodes: BlockNode[]) => {
    for (const node of nodes) {
      if (node.type === 'section') {
        headings.push({ anchor: node.anchor, text: node.title, level: 2 });
        walk(node.children);
      } else if (node.type === 'heading') {
        headings.push({
          anchor: node.anchor,
          text: node.children.map((child) => ('value' in child ? child.value : '')).join(''),
          level: node.level,
        });
      } else if (node.type === 'note' || node.type === 'details' || node.type === 'quote') {
        walk(node.children);
      }
    }
  };

  walk(blocks);
  return headings;
}

