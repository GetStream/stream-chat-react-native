import React, { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { filterTypingUsers } from './utils/filterTypingUsers';

import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { ThreadContextValue, useThreadContext } from '../../contexts/threadContext/ThreadContext';
import { TypingContextValue, useTypingContext } from '../../contexts/typingContext/TypingContext';

import type { StreamChatGenerics } from '../../types/types';

const styles = StyleSheet.create({
  container: {
    bottom: 0,
    position: 'absolute',
    width: '100%',
  },
});

type TypingIndicatorContainerPropsWithContext<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = Pick<TypingContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'typing'> &
  Pick<ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'client'> &
  Pick<ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'thread'>;

const TypingIndicatorContainerWithContext = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  props: PropsWithChildren<TypingIndicatorContainerPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>,
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

export type TypingIndicatorContainerProps<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = Partial<TypingIndicatorContainerPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

export const TypingIndicatorContainer = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  props: PropsWithChildren<TypingIndicatorContainerProps<At, Ch, Co, Ev, Me, Re, Us>>,
) => {
  const { typing } = useTypingContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { thread } = useThreadContext<At, Ch, Co, Ev, Me, Re, Us>();

  return <TypingIndicatorContainerWithContext {...{ client, thread, typing }} {...props} />;
};

TypingIndicatorContainer.displayName =
  'TypingIndicatorContainer{messageList{typingIndicatorContainer}}';
