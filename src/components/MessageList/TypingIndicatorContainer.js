import React from 'react';
import styled from 'styled-components/native';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';

const Container = styled.View`
  bottom: 0px;
  height: 30px;
  padding-left: 16px;
  padding-vertical: 3px;
  position: absolute;
  width: 100%;
  ${({ theme }) => theme.messageList.typingIndicatorContainer.css}
`;

const TypingIndicatorContainer = ({ children }) => {
  const { client } = useChatContext();
  const { typing } = useChannelContext();
  const typingUsers = Object.values(typing);

  if (
    !typingUsers.length ||
    (typingUsers.length === 1 && typingUsers[0].user.id === client.user.id)
  ) {
    return null;
  }

  return <Container testID='typing-indicator-container'>{children}</Container>;
};

export default TypingIndicatorContainer;
