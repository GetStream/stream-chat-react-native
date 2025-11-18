import React, { type PropsWithChildren, useMemo } from 'react';
import { Platform, type ProcessedColorValue } from 'react-native';

import './prism-config';

import SyntaxHighlighterHljs, {
  Prism as SyntaxHighlighterPrism,
} from 'react-syntax-highlighter';
import { defaultStyle } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { prism as prismDefaultStyle } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  DEFAULT_FONT_SIZE,
  generateNewStylesheet,
  nativeRenderer,
} from './utils';
import type {
  NativeSyntaxHighlighterProps,
  SyntaxHighlighterStylesheet,
} from './types';
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

  const Highlighter =
    highlighter === 'prism' ? SyntaxHighlighterPrism : SyntaxHighlighterHljs;

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
