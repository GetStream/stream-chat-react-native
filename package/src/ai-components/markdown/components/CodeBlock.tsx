import { Pressable, type PressableProps, Text, View } from 'react-native';
import type { MarkdownComponentProps, RuleRenderFunction } from '../types';
import { MarkdownReactiveScrollView } from '../../components';
import { SyntaxHighlighter } from '../../syntax-highlighting';
import React, { type PropsWithChildren, useCallback, useMemo } from 'react';
import Chart from '../../charts/Chart';
import { parseJsonChart } from '../../charts';
import { parseMermaid } from '../../charts';

export const CodeBlockCopyButton = ({
  onPress,
}: {
  onPress?: PressableProps['onPress'];
}) => (
  <Pressable
    style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
    onPress={onPress}
  >
    <Text style={{ fontSize: 15 }}>{'\u29C9'}</Text>
  </Pressable>
);

export const CodeBlock = ({ styles, node }: MarkdownComponentProps) => {
  const text = useMemo(() => node.content?.trim(), [node.content]);

  const CodeTag = useCallback(
    ({ children }: PropsWithChildren) => (
      <View style={styles.codeBlockContainer}>
        <Text style={styles.codeBlock}>{children}</Text>
      </View>
    ),
    [styles],
  );

  const CodeBlockHeader = useCallback(
    () => (
      <View style={styles.codeBlockHeaderContainer}>
        <Text style={styles.codeBlockHeaderTitle}>{node.lang}</Text>
        <CodeBlockCopyButton />
      </View>
    ),
    [styles, node.lang],
  );

  const CodeBlockWrapper = useCallback(
    ({ children }: PropsWithChildren) => (
      <View style={styles.codeBlockWrapper}>
        <CodeBlockHeader />
        <MarkdownReactiveScrollView>{children}</MarkdownReactiveScrollView>
      </View>
    ),
    [CodeBlockHeader, styles.codeBlockWrapper],
  );

  if (node.lang === 'mermaid') {
    try {
      const parsed = parseMermaid(text);
      if (parsed) {
        return <Chart spec={parsed} />;
      }
    } catch (_e) {
      /* do nothing */
    }
  }

  if (node.lang === 'json') {
    try {
      const parsed = parseJsonChart(text);
      if (parsed) {
        return <Chart spec={parsed} />;
      }
    } catch (_e) {
      /* do nothing */
    }
  }

  return (
    <SyntaxHighlighter
      language={node.lang}
      highlighter={'prism'}
      CodeTag={CodeTag}
      PreTag={CodeBlockWrapper}
    >
      {text}
    </SyntaxHighlighter>
  );
};

export const renderCodeBlock: RuleRenderFunction = ({
  node,
  output,
  state,
  styles,
}) => (
  <CodeBlock
    key={state.key}
    node={node}
    output={output}
    state={state}
    styles={styles}
  />
);
