import type React from 'react';
import type { TextStyle } from 'react-native';
import type { SyntaxHighlighterProps } from 'react-syntax-highlighter';

export type RNStyle = TextStyle;
export type RNSheet = Record<string, RNStyle>;

export type SyntaxHighlighterStylesheet = NonNullable<NativeSyntaxHighlighterProps['style']>;

export type ExtraSyntaxHighlighterProps = {
  fontFamily?: string;
  fontSize?: number;
  highlighter?: 'highlightjs' | 'prism';
};

export type NativeSyntaxHighlighterProps = SyntaxHighlighterProps & ExtraSyntaxHighlighterProps;

export type CSSP = React.CSSProperties;

export type ConvertOpts = {
  /** Base for `em` units. Defaults to 16. */
  baseFontSize?: number;
  /** Base for `rem` units. Defaults to `baseFontSize`. */
  rootFontSize?: number;
};
