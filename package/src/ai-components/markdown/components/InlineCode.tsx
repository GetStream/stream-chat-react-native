import { Text } from 'react-native';
import type { MarkdownComponentProps, RuleRenderFunction } from '../types';

export const InlineCode = ({ children, styles }: MarkdownComponentProps) => (
  <Text style={styles.inlineCode}>{children}</Text>
);

export const renderInlineCode: RuleRenderFunction = ({
  node,
  output,
  state,
  styles,
}) => {
  state.withinText = true;
  return (
    <InlineCode
      key={state.key}
      node={node}
      output={output}
      state={state}
      styles={styles}
    >
      {output(node.content, state)}
    </InlineCode>
  );
};
