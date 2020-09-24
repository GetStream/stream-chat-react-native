import React from 'react';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { styled } from '../../styles/styledComponents';

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
  bottom: 0px;
  height: 30px;
  padding-left: 16px;
  padding-vertical: 3px;
  position: absolute;
  width: 100%;
  ${({ theme }) => theme.messageList.typingIndicatorContainer.css}
`;

const TypingIndicatorContainer = <
  At extends Record<string, unknown> = DefaultAttachmentType,
  Ch extends Record<string, unknown> = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends Record<string, unknown> = DefaultEventType,
  Me extends Record<string, unknown> = DefaultMessageType,
  Re extends Record<string, unknown> = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
>({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { typing } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const typingUsers = Object.values(typing);

  if (
    !typingUsers.length ||
    (typingUsers.length === 1 &&
      typingUsers?.[0]?.user?.id === client?.user?.id)
  ) {
    return null;
  }

  return <Container testID='typing-indicator-container'>{children}</Container>;
};

export default TypingIndicatorContainer;
