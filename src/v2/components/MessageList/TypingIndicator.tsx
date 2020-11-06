import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTypingString } from './hooks/useTypingString';

import { AvatarProps, Avatar as DefaultAvatar } from '../Avatar/Avatar';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type { Event, UserResponse } from 'stream-chat';

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
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  typingText: {
    marginLeft: 10,
  },
});

export type TypingIndicatorProps = {
  /**
   * Defaults to and accepts same props as: [Avatar](https://getstream.github.io/stream-chat-react-native/#avatar)
   */
  Avatar?: React.ComponentType<AvatarProps>;
};

export const TypingIndicator = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
>({
  Avatar = DefaultAvatar,
}: TypingIndicatorProps) => {
  const { typing } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    theme: {
      typingIndicator: {
        container,
        text: { color, fontSize, ...text },
      },
    },
  } = useTheme();
  const typingString = useTypingString<At, Ch, Co, Ev, Me, Re, Us>();

  const typingUsers = Object.values(typing);

  return (
    <View style={[styles.container, container]} testID='typing-indicator'>
      {(typingUsers.filter(
        ({ user }) => !!user && user.id !== client?.user?.id,
      ) as Array<
        Event<At, Ch, Co, Ev, Me, Re, Us> & { user: UserResponse<Us> }
      >).map(({ user }, idx) => (
        <Avatar
          image={user.image}
          key={`${user.id}${idx}`}
          name={user.name || user.id}
          size={20}
          testID={`typing-avatar-${idx}`}
        />
      ))}
      <Text style={[styles.typingText, { color, fontSize }, text]}>
        {typingString}
      </Text>
    </View>
  );
};

TypingIndicator.displayName = 'TypingIndicator{typingIndicator}';
