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
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<TypingContextValue<StreamChatGenerics>, 'typing'> &
  Pick<ChatContextValue<StreamChatGenerics>, 'client'> &
  Pick<ThreadContextValue<StreamChatGenerics>, 'thread'>;

const TypingIndicatorContainerWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: PropsWithChildren<TypingIndicatorContainerPropsWithContext<StreamChatGenerics>>,
) => {
  const { children, client, thread, typing } = props;

  const {
    theme: {
      messageList: { typingIndicatorContainer },
    },
  } = useTheme('TypingIndicatorContainer');
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
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<TypingIndicatorContainerPropsWithContext<StreamChatGenerics>>;

export const TypingIndicatorContainer = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: PropsWithChildren<TypingIndicatorContainerProps<StreamChatGenerics>>,
) => {
  const { typing } = useTypingContext<StreamChatGenerics>('TypingIndicatorContainer');
  const { client } = useChatContext<StreamChatGenerics>('TypingIndicatorContainer');
  const { thread } = useThreadContext<StreamChatGenerics>('TypingIndicatorContainer');

  return <TypingIndicatorContainerWithContext {...{ client, thread, typing }} {...props} />;
};

TypingIndicatorContainer.displayName =
  'TypingIndicatorContainer{messageList{typingIndicatorContainer}}';
