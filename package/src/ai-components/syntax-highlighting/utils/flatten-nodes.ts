import type { SyntaxHighlighterStylesheet } from '../types';
// @ts-expect-error createStyleObject is not available in the type exports, it is still exported though
import { createStyleObject } from 'react-syntax-highlighter/dist/esm/create-element';
import { processColor } from 'react-native';
import type { ColorRange } from '../SyntaxHighlighter';

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
  const rawRanges: { start: number; end: number; color: string | number }[] =
    [];

  const startingStyle = { fontFamily, fontSize };

  const walk = (
    node: rendererNode | null | undefined,
    inheritedColor: string | number,
  ) => {
    if (!node) return;

    const { type, tagName, value, properties } = node;

    // leaf node
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

    // node with children
    if (tagName) {
      const baseStyle =
        properties && properties.className
          ? createStyleObject(
              properties.className,
              Object.assign(
                { color: defaultColor },
                properties.style,
                startingStyle,
              ),
              stylesheet,
            )
          : { ...startingStyle, color: defaultColor };

      // we take the node's color if present, then its inherited color
      // if present and finally the block's default color if all else
      // fails.
      const effectiveColor =
        (baseStyle as any).color ?? inheritedColor ?? defaultColor;

      const children = node.children || [];
      const childArray = Array.isArray(children) ? children : [children];
      for (let i = 0; i < childArray.length; i++) {
        walk(childArray[i], effectiveColor);
      }
      return;
    }

    // fallback
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

  // Recursively flatten nodes
  const nodeArray = Array.isArray(nodes) ? nodes : [nodes];
  for (let i = 0; i < nodeArray.length; i++) {
    walk(nodeArray[i], defaultColor);
  }

  // Merge adjacent ranges with same color and convert them to integers
  rawRanges.sort((a, b) => a.start - b.start);
  const merged: ColorRange[] = [];
  for (let i = 0; i < rawRanges.length; i++) {
    const r = rawRanges[i]!;
    // in case the color is malformed for some reason, use the defaultColor
    // as this one should always be non-nullish.
    const colorInt = processColor(r.color)!; // ?? processColor(defaultColor))!;

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
): { text: string; ranges: ColorRange[]; longestLine: number } => {
  let fullText = '';
  let longestLine = 0;
  const fullRanges: ColorRange[] = [];

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const rowNodes = rows[rowIndex];

    const { text, ranges } = flattenNodesToTextAndColorRanges({
      ...opts,
      nodes: rowNodes ?? [],
    });

    const offset = fullText.length;
    fullText += text;
    longestLine = Math.max(text.length, longestLine);

    // Add newline between rows (no color)
    if (rowIndex < rows.length - 1) {
      fullText += '\n';
    }

    // Shift ranges by current offset & push
    for (const r of ranges) {
      fullRanges.push({
        start: r.start + offset,
        end: r.end + offset,
        color: r.color,
      });
    }
  }

  return { text: fullText, ranges: fullRanges, longestLine };
};
