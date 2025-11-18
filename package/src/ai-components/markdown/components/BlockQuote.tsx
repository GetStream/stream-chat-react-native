import { Text, View } from 'react-native';
import type { MarkdownComponentProps, RuleRenderFunction } from '../types';

export const BlockQuote = ({ children, styles }: MarkdownComponentProps) => (
  <View style={styles.blockQuoteSection}>
    <View style={styles.blockQuoteSectionBar} />
    <Text style={styles.blockQuoteText}>{children}</Text>
  </View>
);

export const renderBlockQuote: RuleRenderFunction = ({
  node,
  output,
  state,
  styles,
}) => {
  state.withinQuote = true;
  return (
    <BlockQuote
      key={state.key}
      node={node}
      output={output}
      state={state}
      styles={styles}
    >
      {output(node.content, state)}
    </BlockQuote>
  );
};
