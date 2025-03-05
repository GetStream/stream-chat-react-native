import React, { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { filterTypingUsers } from './utils/filterTypingUsers';

import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { ThreadContextValue, useThreadContext } from '../../contexts/threadContext/ThreadContext';
import { TypingContextValue, useTypingContext } from '../../contexts/typingContext/TypingContext';

const styles = StyleSheet.create({
  container: {
    bottom: 0,
    position: 'absolute',
    width: '100%',
  },
});

type TypingIndicatorContainerPropsWithContext = Pick<TypingContextValue, 'typing'> &
  Pick<ChatContextValue, 'client'> &
  Pick<ThreadContextValue, 'thread'>;

const TypingIndicatorContainerWithContext = (
  props: PropsWithChildren<TypingIndicatorContainerPropsWithContext>,
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

export type TypingIndicatorContainerProps = PropsWithChildren<
  Partial<TypingIndicatorContainerPropsWithContext>
>;

export const TypingIndicatorContainer = (props: TypingIndicatorContainerProps) => {
  const { typing } = useTypingContext();
  const { client } = useChatContext();
  const { thread } = useThreadContext();

  return <TypingIndicatorContainerWithContext {...{ client, thread, typing }} {...props} />;
};

TypingIndicatorContainer.displayName =
  'TypingIndicatorContainer{messageList{typingIndicatorContainer}}';
