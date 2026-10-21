import { processColor } from 'react-native';

// @ts-expect-error createStyleObject is not available in the type exports, it is still exported though
import { createStyleObject } from 'react-syntax-highlighter/dist/esm/create-element';

import type { ColorRange } from '../SyntaxHighlighter';
import type { SyntaxHighlighterStylesheet } from '../types';

type FlattenOptions = {
  nodes: rendererNode | rendererNode[];
  stylesheet: SyntaxHighlighterStylesheet;
  defaultColor: string;
  fontFamily?: string;
  fontSize?: number;
};

export const flattenNodesToTextAndColorRanges = ({
  nodes,
  stylesheet,
  defaultColor,
  fontFamily,
  fontSize = 13,
}: FlattenOptions): { text: string; ranges: ColorRange[] } => {
  let text = '';
  const rawRanges: { start: number; end: number; color: string | number }[] = [];

  const startingStyle = { fontFamily, fontSize };

  const walk = (node: rendererNode | null | undefined, inheritedColor: string | number) => {
    if (!node) return;

    const { type, tagName, value, properties } = node;

    if (type === 'text') {
      if (value == null || value === '') return;
      const chunk = String(value);
      const start = text.length;
      text += chunk;

      const color = inheritedColor ?? defaultColor;
      if (color != null && chunk.length) {
        rawRanges.push({ start, end: start + chunk.length, color });
      }
      return;
    }

    if (tagName) {
      const baseStyle =
        properties && properties.className
          ? createStyleObject(
              properties.className,
              Object.assign({ color: defaultColor }, properties.style, startingStyle),
              stylesheet,
            )
          : { ...startingStyle, color: defaultColor };

      // Color precedence: the node's own, then the inherited one, then the block's default.
      const effectiveColor =
        (baseStyle as { color?: string | number }).color ?? inheritedColor ?? defaultColor;

      const children = node.children || [];
      const childArray = Array.isArray(children) ? children : [children];
      for (let i = 0; i < childArray.length; i++) {
        walk(childArray[i], effectiveColor);
      }
      return;
    }

    if (value != null) {
      const chunk = String(value);
      const start = text.length;
      text += chunk;
      const color = inheritedColor ?? defaultColor;
      if (color != null && chunk.length) {
        rawRanges.push({ start, end: start + chunk.length, color });
      }
    }
  };

  const nodeArray = Array.isArray(nodes) ? nodes : [nodes];
  for (let i = 0; i < nodeArray.length; i++) {
    walk(nodeArray[i], defaultColor);
  }

  // Merges adjacent ranges of the same color and converts colors to integers.
  rawRanges.sort((a, b) => a.start - b.start);
  const merged: ColorRange[] = [];
  for (let i = 0; i < rawRanges.length; i++) {
    const r = rawRanges[i]!;
    const colorInt = processColor(r.color)!;

    if (!merged.length) {
      merged.push({ start: r.start, end: r.end, color: colorInt });
      continue;
    }

    const last = merged[merged.length - 1];
    if (last && last.end === r.start && last.color === colorInt) {
      last.end = r.end;
    } else {
      merged.push({ start: r.start, end: r.end, color: colorInt });
    }
  }

  return { text, ranges: merged };
};

export const flattenRowsToTextAndColorRanges = (
  rows: rendererNode[],
  opts: Omit<FlattenOptions, 'nodes'>,
): { text: string; ranges: ColorRange[] } => {
  let fullText = '';
  const fullRanges: ColorRange[] = [];

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const rowNodes = rows[rowIndex];

    const { text, ranges } = flattenNodesToTextAndColorRanges({
      ...opts,
      nodes: rowNodes ?? [],
    });

    const offset = fullText.length;
    fullText += text;

    // Rows are joined by an uncolored newline.
    if (rowIndex < rows.length - 1) {
      fullText += '\n';
    }

    // Shift the row ranges by its offset in the full text.
    for (const r of ranges) {
      fullRanges.push({
        start: r.start + offset,
        end: r.end + offset,
        color: r.color,
      });
    }
  }

  return { text: fullText, ranges: fullRanges };
};
