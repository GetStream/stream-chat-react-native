import { Text } from 'react-native';
import type { MarkdownComponentProps, RuleRenderFunction } from '../types';

export const Bold = ({ children, styles }: MarkdownComponentProps) => (
  <Text style={styles.strong}>{children}</Text>
);

export const renderBold: RuleRenderFunction = ({
  node,
  output,
  state,
  styles,
}) => {
  state.withinText = true;
  return (
    <Bold
      key={state.key}
      node={node}
      output={output}
      state={state}
      styles={styles}
    >
      {output(node.content, state)}
    </Bold>
  );
};
