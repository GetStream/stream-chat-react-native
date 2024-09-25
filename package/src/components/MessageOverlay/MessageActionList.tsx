import React from 'react';
import { StyleSheet, View } from 'react-native';

import { MessageActionType } from './MessageActionListItem';

import { MessagesContextValue } from '../../contexts/messagesContext/MessagesContext';
import type { OverlayProviderProps } from '../../contexts/overlayContext/OverlayContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import type { DefaultStreamChatGenerics } from '../../types/types';

export type MessageActionListProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  OverlayProviderProps<StreamChatGenerics>,
  'error' | 'isMyMessage' | 'isThreadMessage' | 'message'
> &
  Pick<MessagesContextValue, 'MessageActionListItem'> & {
    messageActions?: MessageActionType[];
  };

export const MessageActionList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageActionListProps<StreamChatGenerics>,
) => {
  const { error, isMyMessage, isThreadMessage, message, MessageActionListItem, messageActions } =
    props;
  const {
    theme: {
      messageActionList: { container },
    },
  } = useTheme();

  const messageActionProps = {
    error,
    isMyMessage,
    isThreadMessage,
    message,
  };

  return (
    <View style={[styles.container, container]} testID='message-action-list'>
      {messageActions?.map((messageAction, index) => (
        <MessageActionListItem
          key={messageAction.title}
          {...messageActionProps}
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
