import React from 'react';

import { useTypingString } from './hooks/useTypingString';

import DefaultAvatar, { AvatarProps } from '../Avatar/Avatar';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { styled } from '../../styles/styledComponents';
import { themed } from '../../styles/theme';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
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
  Avatar?: React.ComponentType<Partial<AvatarProps>>;
};

const TypingIndicator = <
  At extends Record<string, unknown> = DefaultAttachmentType,
  Ch extends Record<string, unknown> = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends Record<string, unknown> = DefaultEventType,
  Me extends Record<string, unknown> = DefaultMessageType,
  Re extends Record<string, unknown> = DefaultReactionType,
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
      {typingUsers
        .filter(({ user }) => user?.id !== client?.user?.id)
        .map(({ user }, idx) => (
          <Avatar
            image={user?.image}
            key={`${user?.id}${idx}`}
            name={user?.name || user?.id}
            size={24}
            testID={`typing-avatar-${idx}`}
          />
        ))}
      <TypingText>{typingString}</TypingText>
    </Container>
  );
};

TypingIndicator.themePath = 'typingIndicator';

export default themed(TypingIndicator) as typeof TypingIndicator;
