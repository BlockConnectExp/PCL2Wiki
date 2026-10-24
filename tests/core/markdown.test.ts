import { describe, expect, it } from 'vitest';
import { parseInlineMarkdown, parseMarkdownArticle } from '../../src/core/markdown';

describe('parseInlineMarkdown', () => {
  it('renders wiki links, external links and math', () => {
    const nodes = parseInlineMarkdown(
      '参见 [[量子力学|量子力学条目]]，公式 $E = mc^2$，外链 [示例](https://example.com)。',
    );

    const link = nodes.find((node) => node.type === 'link');
    expect(link).toMatchObject({ type: 'link', target: { slug: '量子力学' } });
    expect(nodes.some((node) => node.type === 'math')).toBe(true);
  });
});

describe('parseMarkdownArticle', () => {
  it('converts frontmatter and block markdown into the shared AST', () => {
    const source = `---
slug: diamond
title: 钻石
tags: [物品, 原版]
lang: zh-CN
---

**钻石**是重要材料。

## 获取

| 用途 | 说明 |
|---|---|
| 工具 | 钻石镐 |
`;

    const document = parseMarkdownArticle(source, 'diamond');
    expect(document.meta).toMatchObject({
      slug: 'diamond',
      title: '钻石',
      lang: 'zh-CN',
      tags: ['物品', '原版'],
    });
    expect(document.blocks.some((block) => block.type === 'heading')).toBe(true);
    expect(document.blocks.some((block) => block.type === 'table')).toBe(true);
    expect(document.headings.some((heading) => heading.text === '获取')).toBe(true);
  });
});
