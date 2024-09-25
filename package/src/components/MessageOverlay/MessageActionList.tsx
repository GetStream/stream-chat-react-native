import React from 'react';
import { StyleSheet, View } from 'react-native';

import { MessageActionType } from './MessageActionListItem';

import { MessagesContextValue } from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

export type MessageActionListProps = Pick<MessagesContextValue, 'MessageActionListItem'> & {
  messageActions?: MessageActionType[];
};

export const MessageActionList = (props: MessageActionListProps) => {
  const { MessageActionListItem, messageActions } = props;
  const {
    theme: {
      messageActionList: { container },
    },
  } = useTheme();

  return (
    <View style={[styles.container, container]} testID='message-action-list'>
      {messageActions?.map((messageAction, index) => (
        <MessageActionListItem
          key={messageAction.title}
          {...{ ...messageAction, index, length: messageActions.length }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
