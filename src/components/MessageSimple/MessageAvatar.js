import React from 'react';
import styled from '@stream-io/styled-components';
import { Avatar } from '../Avatar';

const Container = styled.View`
  margin-right: ${({ theme, alignment }) =>
    alignment === 'left' ? theme.messageAvatar.container.margin : 0};
  margin-left: ${({ theme, alignment }) =>
    alignment === 'right' ? theme.messageAvatar.container.margin : 0};
`;

const Spacer = styled.View`
  width: ${({ theme }) => theme.messageAvatar.spacer.width};
  height: ${({ theme }) => theme.messageAvatar.spacer.height};
`;

export const MessageAvatar = ({ message, isMyMessage, groupStyles }) => {
  const pos = isMyMessage(message) ? 'right' : 'left';

  const showAvatar =
    groupStyles[0] === 'single' || groupStyles[0] === 'bottom' ? true : false;

  return (
    <Container alignment={pos}>
      {showAvatar ? (
        <Avatar
          image={message.user.image}
          name={message.user.name || message.user.id}
        />
      ) : (
        <Spacer />
      )}
    </Container>
  );
};
