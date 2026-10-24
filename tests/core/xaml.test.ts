import { describe, expect, it } from 'vitest';
import { parseWikiXaml } from '../../src/core/xaml';

const ARTICLE = `<!-- 示例：一篇百科文章的 XAML 原稿 -->
<Article
  xmlns="https://pcl2.n0th1n3ssd0ma1n.top/schema/1"
  xmlns:md="https://pcl2.n0th1n3ssd0ma1n.top/markdown/1"
  title="量子计算"
  slug="quantum-computing"
  lang="zh-CN">

  <Infobox>
    <Infobox.Field label="领域">物理学 / 计算机科学</Infobox.Field>
    <Infobox.Image src="./media/feynman.jpg" caption="费曼" />
  </Infobox>

  <Section title="概述">
    <Paragraph>
      **量子计算**是一种利用[量子力学](./quantum-mechanics.md)现象
      进行信息处理的计算范式。与经典计算机使用\`bit\`不同，
      量子计算机使用**量子比特(qubit)**。
    </Paragraph>
  </Section>

  <Section title="核心原理">
    <Paragraph>量子计算的两大基石：</Paragraph>
    <List type="ordered">
      <ListItem>**量子叠加** — 一个量子比特可同时处于 |0⟩ 和 |1⟩ 的叠加态</ListItem>
      <ListItem>**量子纠缠** — 多个量子比特之间建立非经典关联</ListItem>
    </List>
    <CodeBlock language="python" title="Qiskit 示例">
      from qiskit import QuantumCircuit
      qc = QuantumCircuit(2)
      qc.h(0)
      qc.cx(0, 1)
    </CodeBlock>
    <Media src="./media/bloch-sphere.mp4" type="video" caption="布洛赫球面动画" />
  </Section>

  <References>
    <Ref id="1">Feynman, R. (1982). "Simulating Physics with Computers"</Ref>
    <Ref id="2">Shor, P. (1994). "Algorithms for Quantum Computation"</Ref>
  </References>
</Article>`;

describe('parseWikiXaml', () => {
  it('parses the canonical PascalCase article structure', () => {
    const document = parseWikiXaml(ARTICLE, 'quantum-computing');

    expect(document.meta).toMatchObject({
      slug: 'quantum-computing',
      title: '量子计算',
      lang: 'zh-CN',
    });
    expect(document.diagnostics.filter((item) => item.severity === 'error')).toEqual([]);

    const infobox = document.blocks.find((block) => block.type === 'infobox');
    expect(infobox?.type).toBe('infobox');
    if (infobox?.type === 'infobox') {
      expect(infobox.fields).toHaveLength(1);
      expect(infobox.fields[0]?.label).toBe('领域');
      expect(infobox.image?.src).toBe('./media/feynman.jpg');
    }

    const sections = document.blocks.filter((block) => block.type === 'section');
    expect(sections.map((section) => (section.type === 'section' ? section.title : ''))).toEqual([
      '概述',
      '核心原理',
    ]);

    const firstParagraph = sections[0]?.type === 'section' ? sections[0].children[0] : undefined;
    expect(firstParagraph?.type).toBe('paragraph');
    if (firstParagraph?.type === 'paragraph') {
      expect(firstParagraph.children[0]).toMatchObject({ type: 'strong' });
      const link = firstParagraph.children.find((node) => node.type === 'link');
      expect(link).toMatchObject({ type: 'link', target: { slug: 'quantum-mechanics' } });
    }

    const references = document.blocks.find((block) => block.type === 'references');
    if (references?.type === 'references') expect(references.items).toHaveLength(2);

    expect(document.headings.map((heading) => heading.text)).toEqual(['概述', '核心原理']);
  });

  it('parses md:Block regions and inline math', () => {
    const document = parseWikiXaml(
      `<Article xmlns="https://pcl2.n0th1n3ssd0ma1n.top/schema/1"
                xmlns:md="https://pcl2.n0th1n3ssd0ma1n.top/markdown/1"
                title="公式" slug="formula" lang="zh-CN">
        <Paragraph>质能方程是 $E = mc^2$。</Paragraph>
        <md:Block><![CDATA[
## Markdown 章节

- 条目
        ]]></md:Block>
      </Article>`,
      'formula',
    );

    const paragraph = document.blocks.find((block) => block.type === 'paragraph');
    if (paragraph?.type === 'paragraph') {
      expect(paragraph.children.some((node) => node.type === 'math')).toBe(true);
    }
    expect(document.headings.some((heading) => heading.text === 'Markdown 章节')).toBe(true);
  });

  it('reports unknown tags without throwing', () => {
    const document = parseWikiXaml(
      `<Article title="未知" slug="unknown" lang="zh-CN"><Mystery /></Article>`,
      'unknown',
    );

    expect(document.diagnostics.some((item) => item.code === 'SCH001')).toBe(true);
    expect(document.blocks.some((block) => block.type === 'diagnostic')).toBe(true);
  });
});

