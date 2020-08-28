import React, { useContext } from 'react';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';

import { useTypingString } from './hooks/useTypingString';

import DefaultAvatar from '../Avatar/Avatar';

import { ChannelContext, ChatContext } from '../../context';
import { themed } from '../../styles/theme';

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

const TypingIndicator = (props) => {
  const { Avatar = DefaultAvatar } = props;
  const { client } = useContext(ChatContext);
  const { typing } = useContext(ChannelContext);
  const typingString = useTypingString();
  const typingUsers = Object.values(typing);

  return (
    <Container testID='typing-indicator'>
      {typingUsers
        .filter(({ user }) => user.id !== client.user.id)
        .map(({ user }, idx) => (
          <Avatar
            image={user.image}
            key={user.id + idx}
            name={user.name || user.id}
            size={24}
            testID={`typing-avatar-${idx}`}
          />
        ))}
      <TypingText>{typingString}</TypingText>
    </Container>
  );
};

TypingIndicator.themePath = 'typingIndicator';

TypingIndicator.propTypes = {
  /**
   * Defaults to and accepts same props as: [Avatar](https://getstream.github.io/stream-chat-react-native/#avatar)
   */
  Avatar: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
};

export default themed(TypingIndicator);
