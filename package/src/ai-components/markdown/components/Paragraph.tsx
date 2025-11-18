import { Text, type TextStyle, View } from 'react-native';
import type { MarkdownComponentProps, RuleRenderFunction } from '../types';
import { size, some } from 'lodash';
import { useMemo } from 'react';

export const Paragraph = ({
  children,
  styles,
  node,
  state,
  paragraphNumberOfLines,
}: MarkdownComponentProps) => {
  const paragraphStyle = useMemo(() => {
    let style: TextStyle | (TextStyle | undefined)[] | undefined =
      size(node.content) < 3 && some(node.content, { type: 'strong' })
        ? styles.paragraphCenter
        : styles.paragraph;

    if (state.withinList) {
      style = [style, styles.noMargin];
    }

    return style;
  }, [
    node.content,
    state.withinList,
    styles.paragraph,
    styles.paragraphCenter,
    styles.noMargin,
  ]);

  return (
    <Text style={paragraphStyle} numberOfLines={paragraphNumberOfLines}>
      {children}
    </Text>
  );
};

export const ParagraphWithImage = ({
  children,
  styles,
}: MarkdownComponentProps) => (
  <View style={styles.paragraphWithImage}>{children}</View>
);

export const renderParagraph: RuleRenderFunction = ({
  node,
  output,
  state,
  styles,
  paragraphNumberOfLines,
}) => {
  if (some(node.content, { type: 'image' })) {
    state.withinParagraphWithImage = true;

    return (
      <ParagraphWithImage
        key={state.key}
        node={node}
        output={output}
        state={state}
        styles={styles}
      >
        {output(node.content, state)}
      </ParagraphWithImage>
    );
  }

  return (
    <Paragraph
      key={state.key}
      node={node}
      output={output}
      state={state}
      styles={styles}
      paragraphNumberOfLines={paragraphNumberOfLines}
    >
      {output(node.content, state)}
    </Paragraph>
  );
};
