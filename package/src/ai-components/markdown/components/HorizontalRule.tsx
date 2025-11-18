import { View } from 'react-native';
import type { MarkdownComponentProps, RuleRenderFunction } from '../types';

export const HorizontalRule = ({ styles }: MarkdownComponentProps) => (
  <View style={styles.hr} />
);

export const renderHorizontalRule: RuleRenderFunction = ({
  node,
  output,
  state,
  styles,
}) => (
  <HorizontalRule
    key={state.key}
    node={node}
    output={output}
    state={state}
    styles={styles}
  />
);
