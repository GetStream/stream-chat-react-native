import React, { useContext } from 'react';

import styled from '@stream-io/styled-components';

import { ChatContext, ChannelContext } from '../../context';

const Container = styled.View`
  position: absolute;
  bottom: 0;
  height: 30px;
  width: 100%;
  padding-left: 16px;
  padding-top: 3px;
  padding-bottom: 3px;
  ${({ theme }) => theme.messageList.typingIndicatorContainer.css}
`;

const TypingIndicatorContainer = ({ children }) => {
  const { client } = useContext(ChatContext);
  const { typing } = useContext(ChannelContext);
  const typingUsers = Object.values(typing);

  if (
    typingUsers.length === 0 ||
    (typingUsers.length === 1 && typingUsers[0].user.id === client.user.id)
  ) {
    return null;
  }

  return (
    <Container testID={'typing-indicator-container'}>{children}</Container>
  );
};

export default TypingIndicatorContainer;
