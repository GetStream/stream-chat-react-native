import React, { type PropsWithChildren, useMemo } from 'react';
import type { MarkdownProps } from '../types.ts';
import { isArray, isEqual, merge } from 'lodash';
import styles from '../styles.ts';
import SimpleMarkdown, {
  type OutputRules,
  type ParserRules,
  type ReactOutputRule,
} from '@khanacademy/simple-markdown';
import { getLocalRules } from '../rules.ts';
import { View } from 'react-native';

const UnmemoizedMarkdown = (props: PropsWithChildren<MarkdownProps>) => {
  const {
    onLink,
    rules: rulesProp,
    styles: stylesProp,
    paragraphNumberOfLines,
    children,
  } = props;

  const mergedStyles = useMemo(
    () => merge({}, styles, stylesProp),
    [stylesProp],
  );
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

  const parser = useMemo(
    () => SimpleMarkdown.parserFor(localRules),
    [localRules],
  );
  const renderer = useMemo(
    () =>
      SimpleMarkdown.outputFor(
        localRules as unknown as OutputRules<ReactOutputRule>,
        'react',
      ),
    [localRules],
  );

  const childText = useMemo(
    () => (isArray(children) ? children.join('') : children),
    [children],
  );

  const toRender = useMemo(() => {
    const blockSource = `${childText ?? ''}\n\n`;
    return parser(blockSource, { inline: false });
  }, [childText, parser]);

  const tree = useMemo(() => renderer(toRender), [renderer, toRender]);

  return <View style={[styles.view, stylesProp?.view]}>{tree}</View>;
};

const areEqual = (prevProps: PropsWithChildren, nextProps: PropsWithChildren) =>
  isEqual(prevProps.children, nextProps.children);

export const Markdown = React.memo(UnmemoizedMarkdown, areEqual);
