import React, { type PropsWithChildren, useMemo } from 'react';
import { Platform, type ProcessedColorValue } from 'react-native';

import './prism-config';

// Imported by file: Metro does not tree-shake, so the package index (every highlighter variant,
// including the async ones) and the style indexes (every bundled theme) would all be bundled.
import SyntaxHighlighterHljs from 'react-syntax-highlighter/dist/esm/default-highlight';
import SyntaxHighlighterPrism from 'react-syntax-highlighter/dist/esm/prism';
import defaultStyle from 'react-syntax-highlighter/dist/esm/styles/hljs/default-style';
import prismDefaultStyle from 'react-syntax-highlighter/dist/esm/styles/prism/prism';

import type { NativeSyntaxHighlighterProps, SyntaxHighlighterStylesheet } from './types';
import { DEFAULT_FONT_SIZE, generateNewStylesheet, nativeRenderer } from './utils';

import { MarkdownReactiveScrollView } from '../components';

export type ColorRange = {
  start: number;
  end: number;
  color: ProcessedColorValue;
};

export const SyntaxHighlighter = ({
  fontFamily = Platform.OS === 'ios' ? 'Courier' : 'Monospace',
  fontSize = DEFAULT_FONT_SIZE,
  children,
  highlighter = 'highlightjs',
  style = highlighter === 'prism' ? prismDefaultStyle : defaultStyle,
  PreTag = MarkdownReactiveScrollView,
  CodeTag = MarkdownReactiveScrollView,
  ...rest
}: PropsWithChildren<NativeSyntaxHighlighterProps>) => {
  const { transformedStyle, defaultColor } = useMemo(
    () =>
      generateNewStylesheet({
        stylesheet: style,
        highlighter,
      }),
    [highlighter, style],
  );
  const renderer = useMemo(
    () =>
      nativeRenderer({
        defaultColor: defaultColor as string,
        fontFamily,
        fontSize,
      }),
    [defaultColor, fontFamily, fontSize],
  );

  const Highlighter = highlighter === 'prism' ? SyntaxHighlighterPrism : SyntaxHighlighterHljs;

  return (
    <Highlighter
      PreTag={PreTag}
      CodeTag={CodeTag}
      {...rest}
      style={transformedStyle as SyntaxHighlighterStylesheet}
      horizontal={true}
      renderer={renderer}
    >
      {children}
    </Highlighter>
  );
};
