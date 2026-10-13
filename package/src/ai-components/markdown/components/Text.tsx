import { Text } from 'react-native';
import type { MarkdownComponentProps, RuleRenderFunction } from '../types';
import { useMemo } from 'react';

export const TextUI = ({ children, styles, state }: MarkdownComponentProps) => {
  const textStyle = useMemo(() => {
    const style = [styles.text, state.style];

    if (state.withinQuote) {
      style.push(styles.blockQuoteText);
    }

    if (state.withinLink) {
      style.push(styles.autolink);
    }

    return style;
  }, [
    state.style,
    state.withinLink,
    state.withinQuote,
    styles.text,
    styles.autolink,
    styles.blockQuoteText,
  ]);

  return <Text style={textStyle}>{children}</Text>;
};

export const renderText: RuleRenderFunction = ({
  node,
  output,
  state,
  styles,
}) => {
  return (
    <TextUI
      key={state.key}
      node={node}
      output={output}
      state={state}
      styles={styles}
    >
      {node.content}
    </TextUI>
  );
};
