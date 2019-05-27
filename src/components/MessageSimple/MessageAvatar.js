import React from 'react';
import styled from 'styled-components';
import { Avatar } from '../Avatar';
import { getTheme } from '../../styles/theme';

const Container = styled.View`
  margin-right: ${(props) =>
    props.alignment === 'left'
      ? getTheme(props).messageAvatar.container.margin
      : 0};
  margin-left: ${(props) =>
    props.alignment === 'right'
      ? getTheme(props).messageAvatar.container.margin
      : 0};
`;

const Spacer = styled.View`
  width: ${(props) => getTheme(props).messageAvatar.spacer.width};
  height: ${(props) => getTheme(props).messageAvatar.spacer.height};
`;

export const MessageAvatar = ({ message, isMyMessage }) => {
  const pos = isMyMessage(message) ? 'right' : 'left';

  const showAvatar =
    message.groupPosition[0] === 'single' ||
    message.groupPosition[0] === 'bottom'
      ? true
      : false;

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
