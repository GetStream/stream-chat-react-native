import { Text } from 'react-native';
import type { MarkdownComponentProps, RuleRenderFunction } from '../types';

export const Mailto = ({
  children,
  styles,
  onPress,
}: MarkdownComponentProps) => (
  <Text style={styles.url} onPress={onPress}>
    {children}
  </Text>
);

export const renderMailto: RuleRenderFunction = ({
  node,
  output,
  state,
  styles,
  onLink,
}) => {
  state.withinLink = true;
  const onLinkPress = () => onLink && onLink(node.target);
  return (
    <Mailto
      key={state.key}
      node={node}
      output={output}
      state={state}
      styles={styles}
      onPress={onLinkPress}
    >
      {output(node.content, state)}
    </Mailto>
  );
};
