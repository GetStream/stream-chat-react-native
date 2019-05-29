import React from 'react';
import styled from '@stream-io/styled-components';
import { Avatar } from '../Avatar';

const Container = styled.View`
  margin-right: ${({ alignment }) => (alignment === 'left' ? 8 : 0)};
  margin-left: ${({ alignment }) => (alignment === 'right' ? 8 : 0)};
  ${({ theme }) => theme.message.avatarWrapper.container.css}
`;

const Spacer = styled.View`
  width: 32;
  height: 28;
  ${({ theme }) => theme.message.avatarWrapper.spacer.css}
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
