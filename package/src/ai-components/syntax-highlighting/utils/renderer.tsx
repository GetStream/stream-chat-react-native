import type {
  NativeSyntaxHighlighterProps,
  RNSheet,
  RNStyle,
  SyntaxHighlighterStylesheet,
} from '../types';
import { cssToRNTextStyle } from './converter';
import { Platform, Text } from 'react-native';
// @ts-expect-error createStyleObject is not available in the type exports, it is still exported though
import { createStyleObject } from 'react-syntax-highlighter/dist/esm/create-element';
import type { SyntaxHighlighterProps } from 'react-syntax-highlighter';
import { AndroidNativeRenderer } from '../components';
import React from 'react';

export const DEFAULT_FONT_SIZE = 13;

export const generateNewStylesheet = ({
  stylesheet,
  highlighter,
}: {
  stylesheet: SyntaxHighlighterStylesheet;
  highlighter: NativeSyntaxHighlighterProps['highlighter'];
}) => {
  stylesheet = Array.isArray(stylesheet) ? stylesheet[0] : stylesheet;

  const transformedStyle = Object.entries(stylesheet ?? {}).reduce<RNSheet>(
    (newStylesheet, [className, style]) => {
      const rn = cssToRNTextStyle(style);

      newStylesheet[className] = rn as RNStyle;
      return newStylesheet;
    },
    {},
  );

  const topLevel = (
    highlighter === 'prism'
      ? transformedStyle['pre[class*="language-"]']
      : transformedStyle.hljs
  ) as RNStyle;

  const defaultColor = (topLevel && topLevel.color) || '#000';

  return { transformedStyle, defaultColor };
};

export const createChildren = ({
  stylesheet,
  fontSize,
  fontFamily,
}: {
  stylesheet: SyntaxHighlighterStylesheet;
  fontSize?: number;
  fontFamily?: string;
}) => {
  let childrenCount = 0;
  return (children: rendererNode['children'], defaultColor: string) => {
    childrenCount += 1;
    return (children ?? []).map((child, i) =>
      createNativeElement({
        node: child,
        stylesheet,
        key: `code-segment-${childrenCount}-${i}`,
        defaultColor,
        fontSize,
        fontFamily,
      }),
    );
  };
};

export const createNativeElement = ({
  node,
  stylesheet,
  key,
  defaultColor,
  fontFamily,
  fontSize = DEFAULT_FONT_SIZE,
}: {
  node: rendererNode;
  stylesheet: SyntaxHighlighterStylesheet;
  key: string;
  defaultColor: string;
  fontFamily?: string;
  fontSize?: number;
}) => {
  const { properties, type, tagName: TagName, value } = node;
  const startingStyle = { fontFamily, fontSize };
  if (type === 'text') {
    return (
      <Text
        key={key}
        style={Object.assign({ color: defaultColor }, startingStyle)}
      >
        {value}
      </Text>
    );
  } else if (TagName) {
    const childrenFactory = createChildren({
      stylesheet,
      fontSize,
      fontFamily,
    });
    const style = properties
      ? createStyleObject(
          properties.className,
          Object.assign(
            { color: defaultColor },
            properties.style,
            startingStyle,
          ),
          stylesheet,
        )
      : {};
    const children = childrenFactory(
      node.children,
      style.color || defaultColor,
    );
    return (
      <Text key={key} style={style}>
        {children}
      </Text>
    );
  }
};

export const nativeRenderer = ({
  defaultColor,
  fontFamily,
  fontSize = 13,
}: {
  defaultColor: string;
  fontFamily?: string;
  fontSize?: number;
}): SyntaxHighlighterProps['renderer'] => {
  return ({ rows, stylesheet }) =>
    Platform.OS === 'android' ? (
      <AndroidNativeRenderer
        rows={rows}
        stylesheet={stylesheet}
        defaultColor={defaultColor}
        fontFamily={fontFamily}
        fontSize={fontSize}
        lineHeight={fontSize - 4}
      />
    ) : (
      rows.map((node, i) =>
        createNativeElement({
          node,
          stylesheet,
          key: `code-segment-${i}`,
          defaultColor,
          fontFamily,
          fontSize,
        }),
      )
    );
};
