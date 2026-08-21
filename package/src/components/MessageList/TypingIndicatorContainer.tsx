import React, { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { TypingUsersState } from 'stream-chat';

import { filterTypingUsers } from './utils/filterTypingUsers';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useThreadContext } from '../../contexts/threadContext/ThreadContext';
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

type TypingIndicatorContainerPropsWithContext = {
  threadId?: string;
  typing: TypingUsersState['typing'];
} & Pick<ChatContextValue, 'client'>;

const TypingIndicatorContainerWithContext = (
  props: PropsWithChildren<TypingIndicatorContainerPropsWithContext>,
) => {
  const { children, client, threadId, typing } = props;

  const {
    theme: {
      messageList: { typingIndicatorContainer },
    },
  } = useTheme();
  const typingUsers = filterTypingUsers({ client, threadId, typing });

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
  const { threadInstance } = useThreadContext();
  const { typing } = useStateStore(channel.state, typingSelector) ?? { typing: {} };

  return (
    <TypingIndicatorContainerWithContext
      {...{ client, threadId: threadInstance?.id, typing }}
      {...props}
    />
  );
};

TypingIndicatorContainer.displayName =
  'TypingIndicatorContainer{messageList{typingIndicatorContainer}}';
