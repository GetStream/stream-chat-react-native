import { useCallback, useMemo } from 'react';
import {
  generateMarkdownText,
  type MarkdownOutputProps,
  type MarkdownTableRowProps,
} from './markdown';
import { Markdown } from './markdown';
import styles from './markdown/styles.ts';
import type { MarkdownRules, MarkdownStyle } from './markdown';
import { Linking, Text, View } from 'react-native';

import type { SingleASTNode } from '@khanacademy/simple-markdown';
import { MarkdownReactiveScrollView } from './components';

export const MarkdownRichText = ({
  text,
  paragraphNumberOfLines,
  rules,
  styles: markdownStyles,
  onLink: onLinkParam,
}: {
  text: string;
  paragraphNumberOfLines?: number;
  rules?: MarkdownRules;
  styles?: MarkdownStyle;
  onLink?: (url: string) => void;
}) => {
  const markdownText = useMemo(() => generateMarkdownText(text), [text]);

  /**
   * =====================================================================
   */

  const onLink = (url: string) =>
    onLinkParam
      ? onLinkParam(url)
      : Linking.canOpenURL(url).then(
          (canOpenUrl) => canOpenUrl && Linking.openURL(url),
        );

  // take the @ mentions and turn them into markdown?
  // translate links
  // const { mentioned_users } = message;
  // const mentionedUsernames = (mentioned_users || [])
  //     .map((user) => user.name || user.id)
  //     .filter(Boolean)
  //     .sort((a, b) => b.length - a.length)
  //     .map(escapeRegExp);
  // const mentionedUsers = mentionedUsernames.map((username) => `@${username}`).join('|');
  // const regEx = new RegExp(`^\\B(${mentionedUsers})`, 'g');
  // const mentionsMatchFunction: MatchFunction = (source) => regEx.exec(source);
  //
  // const mentionsReact: ReactNodeOutput = (node, output, { ...state }) => {
  //     /**removes the @ prefix of username */
  //     const userName = node.content[0]?.content?.substring(1);
  //     const onPress = (event: GestureResponderEvent) => {
  //         if (!preventPress && onPressParam) {
  //             onPressParam({
  //                 additionalInfo: {
  //                     user: mentioned_users?.find((user: UserResponse) => userName === user.name),
  //                 },
  //                 emitter: 'textMention',
  //                 event,
  //             });
  //         }
  //     };
  //
  //     const onLongPress = (event: GestureResponderEvent) => {
  //         if (!preventPress && onLongPressParam) {
  //             onLongPressParam({
  //                 emitter: 'textMention',
  //                 event,
  //             });
  //         }
  //     };
  //
  //     return (
  //         <Text key={state.key} onLongPress={onLongPress} onPress={onPress} style={styles.mentions}>
  //             {Array.isArray(node.content)
  //                 ? node.content.reduce((acc, current) => acc + current.content, '') || ''
  //                 : output(node.content, state)}
  //         </Text>
  //     );
  // };

  // @ts-ignore
  const tableReact = (node, output, state) => (
    <MarkdownReactiveScrollView key={state.key}>
      <MarkdownTable
        node={node}
        output={output}
        state={state}
        styles={styles}
      />
    </MarkdownReactiveScrollView>
  );

  const customRules = {
    // codeBlock: { react: codeBlockReact },
    // do not render images, we will scrape them out of the message and show on attachment card component
    // list: { react: listReact },
    // Truncate long text content in the message overlay
    // paragraph: paragraphNumberOfLines ? { react: paragraphTextReact } : {},
    // sublist: { react: listReact },
    // table: { react: tableReact },
  };

  /**
   * =====================================================================
   */

  return (
    <Markdown
      // @ts-ignore
      rules={{ ...customRules, ...rules }}
      styles={markdownStyles}
      onLink={onLink}
      paragraphNumberOfLines={paragraphNumberOfLines}
    >
      {markdownText}
    </Markdown>
  );
};

const transpose = (matrix: SingleASTNode[][]) =>
  // TS gets confused because it considers the matrix to be potentially ragged,
  // while the markdown parser can never output a ragged matrix of AST nodes
  // when parsing a table. Hence, we use the forced type coercion.
  (matrix[0] ?? []).map((_, colIndex) => matrix.map((row) => row[colIndex]!));

const MarkdownTable = ({
  node,
  output,
  state,
  styles,
}: MarkdownOutputProps) => {
  const content = useMemo(() => {
    const nodeContent = [node?.header, ...(node?.cells ?? [])];
    return transpose(nodeContent);
  }, [node?.cells, node?.header]);
  const columns = content?.map((column, idx) => (
    <MarkdownTableColumn
      node={node}
      items={column}
      key={`column-${idx}`}
      output={output}
      state={state}
      styles={styles}
    />
  ));

  return (
    <View key={state.key} style={styles.table}>
      {columns}
    </View>
  );
};

const MarkdownTableColumn = ({
  items,
  output,
  state,
  styles,
}: MarkdownTableRowProps) => {
  const [headerCellContent, ...columnCellContents] = items;

  const ColumnCell = useCallback(
    ({ content }: { content: SingleASTNode }) =>
      content ? (
        <View style={styles.tableRow}>
          <View style={styles.tableRowCell}>{output(content, state)}</View>
        </View>
      ) : null,
    [output, state, styles],
  );

  return (
    <View style={{ flex: 1, flexDirection: 'column' }}>
      {headerCellContent ? (
        <View key={-1} style={styles.tableHeader}>
          <Text style={styles.tableHeaderCell}>
            {output(headerCellContent, state)}
          </Text>
        </View>
      ) : null}
      {columnCellContents &&
        columnCellContents.map((content, idx) => (
          <ColumnCell content={content} key={`cell-${idx}`} />
        ))}
    </View>
  );
};
