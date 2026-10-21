import { useCallback, useMemo } from 'react';
import { Text, View } from 'react-native';

import type { SingleASTNode } from '@khanacademy/simple-markdown';

import { MarkdownReactiveScrollView } from '../../components';
import type {
  MarkdownComponentProps,
  MarkdownOutputProps,
  MarkdownTableRowProps,
  RuleRenderFunction,
} from '../types';

export const Table = ({ node, output, styles, state }: MarkdownComponentProps) => (
  <MarkdownReactiveScrollView>
    <MarkdownTable node={node} output={output} state={state} styles={styles} />
  </MarkdownReactiveScrollView>
);

const transpose = (matrix: SingleASTNode[][]) =>
  // TS treats the matrix as potentially ragged, but the markdown parser never outputs a ragged
  // table, so the non-null assertion is safe.
  (matrix[0] ?? []).map((_, colIndex) => matrix.map((row) => row[colIndex]!));

const MarkdownTable = ({ node, output, state, styles }: MarkdownOutputProps) => {
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

const MarkdownTableColumn = ({ items, output, state, styles }: MarkdownTableRowProps) => {
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
          <Text style={styles.tableHeaderCell}>{output(headerCellContent, state)}</Text>
        </View>
      ) : null}
      {columnCellContents &&
        columnCellContents.map((content, idx) => (
          <ColumnCell content={content} key={`cell-${idx}`} />
        ))}
    </View>
  );
};

export const renderTable: RuleRenderFunction = ({ node, output, state, styles }) => (
  <Table key={state.key} node={node} output={output} state={state} styles={styles}>
    {node.content?.trim()}
  </Table>
);
