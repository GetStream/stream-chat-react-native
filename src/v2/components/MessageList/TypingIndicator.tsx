import React from 'react';

import { useTypingString } from './hooks/useTypingString';

import { AvatarProps, Avatar as DefaultAvatar } from '../Avatar/Avatar';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';

import { styled } from '../../../styles/styledComponents';

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

const Container = styled.View`
  align-items: center;
  flex-direction: row;
  justify-content: flex-start;
  ${({ theme }) => theme.typingIndicator.container.css};
`;

const TypingText = styled.Text`
  color: ${({ theme }) => theme.typingIndicator.text.color};
  font-size: ${({ theme }) => theme.typingIndicator.text.fontSize}px;
  margin-left: 10px;
  ${({ theme }) => theme.typingIndicator.text.css};
`;

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
  const typingString = useTypingString<At, Ch, Co, Ev, Me, Re, Us>();

  const typingUsers = Object.values(typing);

  return (
    <Container testID='typing-indicator'>
      {(typingUsers.filter(
        ({ user }) => !!user && user.id !== client?.user?.id,
      ) as Array<
        Event<At, Ch, Co, Ev, Me, Re, Us> & { user: UserResponse<Us> }
      >).map(({ user }, idx) => (
        <Avatar
          image={user.image}
          key={`${user.id}${idx}`}
          name={user.name || user.id}
          size={24}
          testID={`typing-avatar-${idx}`}
        />
      ))}
      <TypingText>{typingString}</TypingText>
    </Container>
  );
};
