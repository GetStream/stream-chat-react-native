import React, { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { filterTypingUsers } from './utils/filterTypingUsers';

import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { ThreadContextValue, useThreadContext } from '../../contexts/threadContext/ThreadContext';
import { TypingContextValue, useTypingContext } from '../../contexts/typingContext/TypingContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

const styles = StyleSheet.create({
  container: {
    bottom: 0,
    position: 'absolute',
    width: '100%',
  },
});

type TypingIndicatorContainerPropsWithContext<
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<TypingContextValue<StreamChatClient>, 'typing'> &
  Pick<ChatContextValue<StreamChatClient>, 'client'> &
  Pick<ThreadContextValue<StreamChatClient>, 'thread'>;

const TypingIndicatorContainerWithContext = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: PropsWithChildren<TypingIndicatorContainerPropsWithContext<StreamChatClient>>,
) => {
  const { children, client, thread, typing } = props;

  const {
    theme: {
      messageList: { typingIndicatorContainer },
    },
  } = useTheme();
  const typingUsers = filterTypingUsers({ client, thread, typing });

  if (!typingUsers.length) {
    return null;
  }

  return (
    <View style={[styles.container, typingIndicatorContainer]} testID='typing-indicator-container'>
      {children}
    </View>
  );
};

export type TypingIndicatorContainerProps<
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<TypingIndicatorContainerPropsWithContext<StreamChatClient>>;

export const TypingIndicatorContainer = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: PropsWithChildren<TypingIndicatorContainerProps<StreamChatClient>>,
) => {
  const { typing } = useTypingContext<StreamChatClient>();
  const { client } = useChatContext<StreamChatClient>();
  const { thread } = useThreadContext<StreamChatClient>();

  return <TypingIndicatorContainerWithContext {...{ client, thread, typing }} {...props} />;
};

TypingIndicatorContainer.displayName =
  'TypingIndicatorContainer{messageList{typingIndicatorContainer}}';
