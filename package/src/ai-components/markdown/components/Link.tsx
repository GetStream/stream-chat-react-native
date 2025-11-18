import { Text } from 'react-native';
import type { MarkdownComponentProps, RuleRenderFunction } from '../types';

export const Link = ({ children, styles, onPress }: MarkdownComponentProps) => (
  <Text style={styles.autolink} onPress={onPress} suppressHighlighting={false}>
    {children}
  </Text>
);

export const renderLink: RuleRenderFunction = ({
  node,
  output,
  state,
  styles,
  onLink,
}) => {
  const url = state.parentLink ?? node.target;
  state.withinLink = true;
  state.parentLink = url;
  const onLinkPress = () => onLink && onLink(url);
  return (
    <Link
      key={state.key}
      node={node}
      output={output}
      state={state}
      styles={styles}
      onPress={onLinkPress}
    >
      {output(node.content, state)}
    </Link>
  );
};
