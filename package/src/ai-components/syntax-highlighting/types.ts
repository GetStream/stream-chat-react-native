import type { TextStyle } from 'react-native';
import type { SyntaxHighlighterProps } from 'react-syntax-highlighter';
import type React from 'react';

export type RNStyle = TextStyle;
export type RNSheet = Record<string, RNStyle>;

export type SyntaxHighlighterStylesheet = NonNullable<
  NativeSyntaxHighlighterProps['style']
>;

export type ExtraSyntaxHighlighterProps = {
  fontFamily?: string;
  fontSize?: number;
  highlighter?: 'highlightjs' | 'prism';
};

export type NativeSyntaxHighlighterProps = SyntaxHighlighterProps &
  ExtraSyntaxHighlighterProps;

export type CSSP = React.CSSProperties;

/** Options for unit conversion */
export type ConvertOpts = {
  /** base for `em` (defaults to 16) */
  baseFontSize?: number;
  /** root base for `rem` (defaults to baseFontSize) */
  rootFontSize?: number;
};
