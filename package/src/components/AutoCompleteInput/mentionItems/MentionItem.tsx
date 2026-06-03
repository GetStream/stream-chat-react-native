import React, { PropsWithChildren, ReactNode, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../theme';

export type MentionItemProps = PropsWithChildren<{
  /**
   * Leading visual rendered to the left of the row. UserAvatar for user
   * mentions, an `EnhancedMentionIcon` for the rest.
   */
  leading?: ReactNode;
  testID?: string;
}>;

/**
 * Layout primitive for every mention-suggestion row: `[leading | content]`.
 * The per-type content (tokenized user name, or `EnhancedMentionContent` for
 * channel/here/role/user_group) is passed as children. Container and column
 * styles come from `theme.messageComposer.suggestions.mention`.
 */
export const MentionItem = ({ children, leading, testID }: MentionItemProps) => {
  const {
    theme: {
      messageComposer: {
        suggestions: {
          mention: { column, container },
        },
      },
    },
  } = useTheme();
  const styles = useStyles();

  return (
    <View style={[styles.container, container]} testID={testID}>
      {leading}
      <View style={[styles.column, column]}>{children}</View>
    </View>
  );
};

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        column: {
          flex: 1,
          justifyContent: 'space-evenly',
        },
        container: {
          alignItems: 'center',
          flexDirection: 'row',
          paddingHorizontal: primitives.spacingXs,
          paddingVertical: primitives.spacingXs,
          gap: primitives.spacingSm,
        },
      }),
    [],
  );
