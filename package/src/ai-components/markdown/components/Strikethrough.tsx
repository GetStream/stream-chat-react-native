import { Text } from 'react-native';
import type { MarkdownComponentProps, RuleRenderFunction } from '../types.ts';

export const Strikethrough = ({ children, styles }: MarkdownComponentProps) => (
  <Text style={styles.del}>{children}</Text>
);

export const renderStrikethrough: RuleRenderFunction = ({
  node,
  output,
  state,
  styles,
}) => {
  state.withinText = true;
  return (
    <Strikethrough
      key={state.key}
      node={node}
      output={output}
      state={state}
      styles={styles}
    >
      {output(node.content, state)}
    </Strikethrough>
  );
};
