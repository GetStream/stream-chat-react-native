import type { ChartSpec, Datum } from '../types';
import { colorFromLabel } from '../utils';

export const parseMermaidPie = (lines: string[]): ChartSpec => {
  let title: string | undefined;
  const data: Datum[] = [];
  const usedHues: number[] = [];
  for (const ln of lines.slice(1)) {
    const t = ln.match(/^title\s+(.+)$/i);
    // TODO: Check if this is correct ? We only have one group.
    if (t && t[1]) {
      title = t[1]?.trim();
      continue;
    }
    const d = ln.match(/^(?:"([^"]+)"|([^"]+))\s*:\s*([+-]?\d+(?:\.\d+)?)/);
    if (d) {
      const label = (d[1] ?? d[2] ?? '').trim();
      data.push({
        dimension: label,
        value: Number(d[3]),
        color: colorFromLabel(label, usedHues),
      });
    }
  }
  return { type: 'pie', title, data };
};

export const parseMermaid = (code: string) => {
  const lines = code.split(/\r?\n/).map((l) => l.trim());
  if (/^pie\b/i.test(lines[0] || '')) return parseMermaidPie(lines);

  throw new Error('Unknown mermaid diagram type');
};
