import type {
  BulletProps,
  MarkdownComponentProps,
  RuleRenderFunction,
} from '../types';
import { Text, type TextProps, View, type ViewProps } from 'react-native';
import type { SingleASTNode } from '@khanacademy/simple-markdown';
import type { PropsWithChildren } from 'react';

export const List = ({
  node,
  output,
  state,
  styles,
}: MarkdownComponentProps) => {
  let isSublist = state.withinList;
  const parentTypes = ['text', 'paragraph', 'strong'];

  return (
    <View key={state.key} style={isSublist ? styles?.sublist : styles?.list}>
      {node.items.map((item: SingleASTNode, index: number) => {
        const indexAfterStart = node.start + index;

        if (item === null) {
          return (
            <ListRow key={index} style={styles?.listRow}>
              <Bullet
                index={node.ordered && indexAfterStart}
                style={
                  node.ordered ? styles?.listItemNumber : styles?.listItemBullet
                }
              />
            </ListRow>
          );
        }

        isSublist = item.length > 1 && item[1].type === 'list';
        const isSublistWithinText =
          parentTypes.includes((item[0] ?? {}).type) && isSublist;
        const style = isSublistWithinText ? { marginBottom: 0 } : {};

        return (
          <ListRow key={index} style={styles?.listRow}>
            <Bullet
              index={node.ordered && indexAfterStart}
              style={
                node.ordered ? styles?.listItemNumber : styles?.listItemBullet
              }
            />
            <ListItem key={1} style={[styles?.listItemText, style]}>
              {output(item, { ...state, withinList: true })}
            </ListItem>
          </ListRow>
        );
      })}
    </View>
  );
};

const Bullet = ({ index, style }: BulletProps) => (
  <Text key={0} style={style}>
    {index ? `${index}. ` : '\u2022 '}
  </Text>
);

const ListRow = ({ children, style }: PropsWithChildren<ViewProps>) => (
  <View style={style}>{children}</View>
);

const ListItem = ({ children, style }: PropsWithChildren<TextProps>) => (
  <Text style={style}>{children}</Text>
);

export const renderList: RuleRenderFunction = ({
  node,
  output,
  state,
  styles,
}) => (
  <List
    key={`list-${state.key}`}
    node={node}
    output={output}
    state={state}
    styles={styles}
  />
);
