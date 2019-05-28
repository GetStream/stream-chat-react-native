import React from 'react';
import styled from '@stream-io/styled-components';
import { Avatar } from '../Avatar';

const Container = styled.View`
  margin-right: ${({ alignment }) => (alignment === 'left' ? 8 : 0)};
  margin-left: ${({ alignment }) => (alignment === 'right' ? 8 : 0)};
  ${({ theme }) => theme.messageAvatar.container.extra}
`;

const Spacer = styled.View`
  width: 32;
  height: 28;
  ${({ theme }) => theme.messageAvatar.spacer.extra}
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
