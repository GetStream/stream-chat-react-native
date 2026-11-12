import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import type { MarkdownComponentProps, RuleRenderFunction } from '../types';

export const TextUI = ({ children, styles, state }: MarkdownComponentProps) => {
  // Text in a heading or inline code takes that one's size rather than the body's.
  const usesBodySize = !state.withinHeading && !state.withinInlineCode;
  const textStyle = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- left out to inherit the wrapper's size
    const { fontSize, lineHeight, ...unsized } = StyleSheet.flatten(styles.text) ?? {};
    const style = [usesBodySize ? styles.text : unsized, state.style];

    if (state.withinQuote) {
      style.push(styles.blockQuoteText);
    }

    if (state.withinLink) {
      style.push(styles.autolink);
    }

    return style;
  }, [
    usesBodySize,
    state.style,
    state.withinLink,
    state.withinQuote,
    styles.text,
    styles.autolink,
    styles.blockQuoteText,
  ]);

  return <Text style={textStyle}>{children}</Text>;
};

export const renderText: RuleRenderFunction = ({ node, output, state, styles }) => {
  return (
    <TextUI key={state.key} node={node} output={output} state={state} styles={styles}>
      {node.content}
    </TextUI>
  );
};
