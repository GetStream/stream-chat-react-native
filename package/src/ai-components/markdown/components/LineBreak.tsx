import { Text } from 'react-native';
import type { MarkdownComponentProps, RuleRenderFunction } from '../types.ts';

export const LineBreak = ({ styles }: MarkdownComponentProps) => (
  <Text style={styles.br}>{'\n\n'}</Text>
);

export const renderLineBreak: RuleRenderFunction = ({
  node,
  output,
  state,
  styles,
}) => (
  <LineBreak
    key={state.key}
    node={node}
    output={output}
    state={state}
    styles={styles}
  />
);
