import React, { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { TypingUsersState } from 'stream-chat';

import { filterTypingUsers } from './utils/filterTypingUsers';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { ThreadContextValue, useThreadContext } from '../../contexts/threadContext/ThreadContext';
import { useStateStore } from '../../hooks/useStateStore';
import { primitives } from '../../theme';

const styles = StyleSheet.create({
  container: {
    paddingVertical: primitives.spacingXs,
    paddingHorizontal: primitives.spacingMd,
    width: '100%',
  },
});

const typingSelector = (state: TypingUsersState) => ({ typing: state.typing });

type TypingIndicatorContainerPropsWithContext = { typing: TypingUsersState['typing'] } & Pick<
  ChatContextValue,
  'client'
> &
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
  const { channel } = useChannelContext();
  const { client } = useChatContext();
  const { thread } = useThreadContext();
  const { typing } = useStateStore(channel.state.typingStore, typingSelector) ?? { typing: {} };

  return <TypingIndicatorContainerWithContext {...{ client, thread, typing }} {...props} />;
};

TypingIndicatorContainer.displayName =
  'TypingIndicatorContainer{messageList{typingIndicatorContainer}}';
