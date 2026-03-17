import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';

import { MessageActionType } from './MessageActionListItem';

import { MessagesContextValue } from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { primitives } from '../../theme';

export type MessageActionListProps = Pick<MessagesContextValue, 'MessageActionListItem'> & {
  /**
   * Function to close the message actions bottom sheet
   * @returns void
   */
  dismissOverlay?: () => void;
  /**
   * An array of message actions to render
   */
  messageActions?: MessageActionType[];
};

export const MessageActionList = (props: MessageActionListProps) => {
  const { MessageActionListItem, messageActions } = props;
  const {
    theme: {
      colors: { white },
      messageMenu: {
        actionList: { container, contentContainer },
      },
    },
  } = useTheme();
  const styles = useStyles();

  const standardActions = messageActions?.filter((action) => action.type === 'standard') ?? [];
  const destructiveActions =
    messageActions?.filter((action) => action.type === 'destructive') ?? [];

  if (messageActions?.length === 0) {
    return null;
  }

  return (
    <ScrollView
      accessibilityLabel='Message action list'
      contentContainerStyle={[
        styles.contentContainer,
        { backgroundColor: white },
        contentContainer,
      ]}
      style={[styles.container, { backgroundColor: white }, container]}
    >
      {standardActions?.map((messageAction, index) => (
        <MessageActionListItem
          key={messageAction.title}
          {...{ ...messageAction, index, length: standardActions.length }}
        />
      ))}
      <View style={styles.separatorContainer}>
        <View style={styles.separator} />
      </View>
      {destructiveActions?.map((messageAction, index) => (
        <MessageActionListItem
          key={messageAction.title}
          {...{ ...messageAction, index, length: standardActions.length }}
        />
      ))}
    </ScrollView>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          borderRadius: primitives.radiusLg,
          marginTop: 6,
          backgroundColor: semantics.backgroundCoreElevation2,
          borderWidth: 1,
          borderColor: semantics.borderCoreDefault,
        },
        contentContainer: {
          borderRadius: 16,
          flexGrow: 1,
          minWidth: 250,
          padding: primitives.spacingXxs,
        },
        separatorContainer: {
          paddingVertical: primitives.spacingXxs,
        },
        separator: {
          height: 1,
          width: '100%',
          backgroundColor: semantics.borderCoreDefault,
        },
      }),
    [semantics.backgroundCoreElevation2, semantics.borderCoreDefault],
  );
};
