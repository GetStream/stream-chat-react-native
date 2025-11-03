import { Text } from 'react-native';
import type { MarkdownComponentProps, RuleRenderFunction } from '../types.ts';

export const NewLine = ({ styles }: MarkdownComponentProps) => (
  <Text style={styles.br}>{'\n'}</Text>
);

export const renderNewLine: RuleRenderFunction = ({
  node,
  output,
  state,
  styles,
}) => (
  <NewLine
    key={state.key}
    node={node}
    output={output}
    state={state}
    styles={styles}
  />
);
