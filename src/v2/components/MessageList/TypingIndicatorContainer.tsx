import React from 'react';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';

import { styled } from '../../../styles/styledComponents';

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
  bottom: 0px;
  height: 30px;
  padding-left: 16px;
  padding-vertical: 3px;
  position: absolute;
  width: 100%;
  ${({ theme }) => theme.messageList.typingIndicatorContainer.css}
`;

type Props = {
  children?: React.ReactNode;
};

export const TypingIndicatorContainer = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
>({
  children,
}: Props) => {
  const { typing } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const typingUsers = Object.values(typing);

  if (
    !typingUsers.length ||
    (typingUsers.length === 1 && typingUsers[0].user?.id === client?.user?.id)
  ) {
    return null;
  }

  return <Container testID='typing-indicator-container'>{children}</Container>;
};
