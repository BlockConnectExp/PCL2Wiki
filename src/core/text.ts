export function normalizeXmlText(value: string): string {
  const lines = value.replace(/\r\n?/g, '\n').split('\n');
  let output = '';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (!output) {
      output = line;
      continue;
    }

    const previous = output.at(-1) ?? '';
    const next = line.at(0) ?? '';
    const needsSpace = /[A-Za-z0-9)]/.test(previous) && /[A-Za-z0-9([]/.test(next);
    output += needsSpace ? ` ${line}` : line;
  }

  return output.replace(/[ \t]{2,}/g, ' ').trim();
}

export function slugify(input: string): string {
  const normalized = input.trim().normalize('NFKC').toLowerCase();
  const cleaned = normalized
    .replace(/[^\p{Letter}\p{Number}\s._-]/gu, '')
    .replace(/[\s._]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return cleaned || 'section';
}

export function createAnchorRegistry(): (input: string) => string {
  const counts = new Map<string, number>();

  return (input: string) => {
    const base = slugify(input);
    const count = counts.get(base) ?? 0;
    counts.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  };
}

export function stripSingleNewline(value: string): string {
  return value.replace(/^\n/, '').replace(/\n$/, '');
}

