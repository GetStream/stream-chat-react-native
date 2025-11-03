import { Text } from 'react-native';
import type { MarkdownComponentProps, RuleRenderFunction } from '../types.ts';

export const Emphasis = ({ children, styles }: MarkdownComponentProps) => (
  <Text style={styles.em}>{children}</Text>
);

export const renderEmphasis: RuleRenderFunction = ({
  node,
  output,
  state,
  styles,
}) => {
  state.withinText = true;
  return (
    <Emphasis
      key={state.key}
      node={node}
      output={output}
      state={state}
      styles={styles}
    >
      {output(node.content, state)}
    </Emphasis>
  );
};
