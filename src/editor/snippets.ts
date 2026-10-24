export interface Snippet {
  id: string;
  label: string;
  insert: string;
}

export const SNIPPETS: Snippet[] = [
  {
    id: 'section',
    label: '章节 Section',
    insert: '<Section title="新章节">\n  <Paragraph></Paragraph>\n</Section>',
  },
  {
    id: 'paragraph',
    label: '段落 Paragraph',
    insert: '<Paragraph></Paragraph>',
  },
  {
    id: 'heading',
    label: '标题 Heading',
    insert: '<Heading level="3"></Heading>',
  },
  {
    id: 'list',
    label: '列表 List',
    insert: '<List type="unordered">\n  <ListItem></ListItem>\n</List>',
  },
  {
    id: 'code',
    label: '代码块 CodeBlock',
    insert: '<CodeBlock language="" title=""></CodeBlock>',
  },
  {
    id: 'table',
    label: '表格 Table',
    insert:
      '<Table>\n  <TableRow header="true">\n    <TableCell></TableCell>\n    <TableCell></TableCell>\n  </TableRow>\n  <TableRow>\n    <TableCell></TableCell>\n    <TableCell></TableCell>\n  </TableRow>\n</Table>',
  },
  {
    id: 'media',
    label: '媒体 Media',
    insert: '<Media src="./assets/" type="image" caption="" />',
  },
  {
    id: 'math',
    label: '公式 Math',
    insert: '<Math display="block"></Math>',
  },
  {
    id: 'quote',
    label: '引用 Quote',
    insert: '<Quote source=""></Quote>',
  },
  {
    id: 'references',
    label: '参考文献 References',
    insert: '<References>\n  <Ref id="1"></Ref>\n</References>',
  },
  {
    id: 'markdown',
    label: 'Markdown 区块',
    insert: '<md:Block><![CDATA[\n## 标题\n\n正文\n]]></md:Block>',
  },
];

