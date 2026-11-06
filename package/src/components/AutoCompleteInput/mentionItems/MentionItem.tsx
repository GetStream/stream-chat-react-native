import React, { PropsWithChildren, ReactNode, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../theme';

export type MentionItemProps = PropsWithChildren<{
  /** Visual rendered before the content: a user avatar or an `EnhancedMentionIcon`. */
  leading?: ReactNode;
  testID?: string;
}>;

/**
 * Layout of a mention-suggestion row: the `leading` visual followed by the children as content.
 * Styled through `theme.messageComposer.suggestions.mention`.
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
