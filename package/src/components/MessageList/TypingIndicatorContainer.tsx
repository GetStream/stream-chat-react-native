import React, { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { filterTypingUsers } from './utils/filterTypingUsers';

import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { ThreadContextValue, useThreadContext } from '../../contexts/threadContext/ThreadContext';
import { TypingContextValue, useTypingContext } from '../../contexts/typingContext/TypingContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

const styles = StyleSheet.create({
  container: {
    bottom: 0,
    position: 'absolute',
    width: '100%',
  },
});

type TypingIndicatorContainerPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType,
> = Pick<TypingContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'typing'> &
  Pick<ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'client'> &
  Pick<ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'thread'>;

const TypingIndicatorContainerWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType,
>(
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

export type TypingIndicatorContainerProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType,
> = Partial<TypingIndicatorContainerPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

export const TypingIndicatorContainer = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType,
>(
  props: PropsWithChildren<TypingIndicatorContainerProps<At, Ch, Co, Ev, Me, Re, Us>>,
) => {
  const { typing } = useTypingContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { thread } = useThreadContext<At, Ch, Co, Ev, Me, Re, Us>();

  return <TypingIndicatorContainerWithContext {...{ client, thread, typing }} {...props} />;
};

TypingIndicatorContainer.displayName =
  'TypingIndicatorContainer{messageList{typingIndicatorContainer}}';
