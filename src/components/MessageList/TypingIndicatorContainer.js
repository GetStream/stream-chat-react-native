import React, { useContext } from 'react';
import styled from 'styled-components/native';

import { ChannelContext, ChatContext } from '../../context';

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
  const { client } = useContext(ChatContext);
  const { typing } = useContext(ChannelContext);
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
