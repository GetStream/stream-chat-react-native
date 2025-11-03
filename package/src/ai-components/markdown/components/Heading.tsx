import { Text } from 'react-native';
import type {
  HeadingLevel,
  MarkdownComponentProps,
  RuleRenderFunction,
} from '../types.ts';
import { useMemo } from 'react';

const DEFAULT_HEADING_LEVEL = undefined;

const isValidHeadingLevel = (n: unknown): n is HeadingLevel =>
  (Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 6) ||
  n === undefined;

export const Heading = ({ children, node, styles }: MarkdownComponentProps) => {
  const headingLevel = isValidHeadingLevel(node.level)
    ? node.level
    : DEFAULT_HEADING_LEVEL;
  const headingStyle = useMemo(
    () => styles[`heading${headingLevel ?? ''}`],
    [headingLevel],
  );
  return <Text style={headingStyle}>{children}</Text>;
};

export const renderHeading: RuleRenderFunction = ({
  node,
  output,
  state,
  styles,
}) => {
  state.withinText = true;
  state.withinHeading = true;
  return (
    <Heading
      key={state.key}
      node={node}
      output={output}
      state={state}
      styles={styles}
    >
      {output(node.content, state)}
    </Heading>
  );
};
