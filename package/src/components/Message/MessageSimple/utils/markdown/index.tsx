import React, { PropsWithChildren, useMemo } from 'react';
import { View } from 'react-native';

import SimpleMarkdown, {
  OutputRules,
  ParserRules,
  ReactOutputRule,
} from '@khanacademy/simple-markdown';
import { isArray, isEqual, merge } from 'lodash';

import { getLocalRules } from './rules';
import styles from './styles';

import { MarkdownStyle } from '../../../../../contexts';

type DefaultRules = typeof SimpleMarkdown.defaultRules;

export type MarkdownRules = Partial<DefaultRules>;

export type MarkdownProps = {
  onLink: (url: string) => Promise<void>;
  rules: MarkdownRules;
  styles: MarkdownStyle;
};

export type MarkdownOptions = Partial<Pick<MarkdownProps, 'onLink'>>;

const Markdown = (props: PropsWithChildren<MarkdownProps>) => {
  const { onLink, rules: rulesProp, styles: stylesProp, children } = props;

  const mergedStyles = useMemo(() => merge({}, styles, stylesProp), [stylesProp]);
  const localRules = useMemo(
    () =>
      merge(
        {},
        SimpleMarkdown.defaultRules,
        { ...SimpleMarkdown.defaultRules },
        getLocalRules(mergedStyles, { onLink }),
        rulesProp,
      ) as unknown as ParserRules,
    [mergedStyles, onLink, rulesProp],
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

  return <View style={[styles.view, stylesProp?.view]}>{tree}</View>;
};

const areEqual = (prevProps: PropsWithChildren, nextProps: PropsWithChildren) =>
  isEqual(prevProps.children, nextProps.children);

export default React.memo(Markdown, areEqual);
