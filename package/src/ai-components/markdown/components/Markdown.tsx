import React, { type PropsWithChildren, useMemo } from 'react';

import { View } from 'react-native';

import SimpleMarkdown, {
  type OutputRules,
  type ParserRules,
  type ReactOutputRule,
} from '@khanacademy/simple-markdown';
import { isArray, isEqual, merge } from 'lodash';

import { useTheme } from '../../contexts';
import { getLocalRules } from '../rules';

import { getLocalStyles } from '../styles';
import type { MarkdownProps } from '../types';

const UnmemoizedMarkdown = (props: PropsWithChildren<MarkdownProps>) => {
  const { theme } = useTheme();

  const { onLink, rules: rulesProp, paragraphNumberOfLines, children } = props;

  const mergedStyles = useMemo(() => merge({}, getLocalStyles({ theme }), theme.markdown), [theme]);

  const localRules = useMemo(
    () =>
      merge(
        {},
        SimpleMarkdown.defaultRules,
        getLocalRules(mergedStyles, { onLink, paragraphNumberOfLines }),
        rulesProp,
      ) as unknown as ParserRules,
    [mergedStyles, onLink, rulesProp, paragraphNumberOfLines],
  );

  const parser = useMemo(() => SimpleMarkdown.parserFor(localRules), [localRules]);
  const renderer = useMemo(
    () => SimpleMarkdown.outputFor(localRules as unknown as OutputRules<ReactOutputRule>, 'react'),
    [localRules],
  );

  const childText = useMemo(() => (isArray(children) ? children.join('') : children), [children]);

  const toRender = useMemo(() => {
    const blockSource = `${childText ?? ''}\n\n`;
    return parser(blockSource, { inline: false });
  }, [childText, parser]);

  const tree = useMemo(() => renderer(toRender), [renderer, toRender]);

  return <View style={mergedStyles.view}>{tree}</View>;
};

const areEqual = (prevProps: PropsWithChildren, nextProps: PropsWithChildren) =>
  isEqual(prevProps.children, nextProps.children);

export const Markdown = React.memo(UnmemoizedMarkdown, areEqual);
