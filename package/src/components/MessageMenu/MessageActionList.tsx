import React from 'react';
import { StyleSheet } from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';

import { MessageActionType } from './MessageActionListItem';

import { MessagesContextValue } from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

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
      messageMenu: {
        actionList: { container, contentContainer },
      },
    },
  } = useTheme();

  if (messageActions?.length === 0) {
    return null;
  }

  return (
    <ScrollView
      accessibilityLabel='Message action list'
      contentContainerStyle={[styles.contentContainer, contentContainer]}
      style={[styles.container, container]}
    >
      {messageActions?.map((messageAction, index) => (
        <MessageActionListItem
          key={messageAction.title}
          {...{ ...messageAction, index, length: messageActions.length }}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {},
  contentContainer: {
    paddingHorizontal: 16,
  },
});
