import React, { useContext } from 'react';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';

import { Avatar as DefaultAvatar } from '../Avatar';
import { ChannelContext, ChatContext, TranslationContext } from '../../context';
import { themed } from '../../styles/theme';
import { constructTypingString } from './utils';

const Container = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  ${({ theme }) => theme.typingIndicator.container.css};
`;

const TypingText = styled.Text`
  margin-left: 10px;
  font-size: ${({ theme }) => theme.typingIndicator.text.fontSize}px;
  color: ${({ theme }) => theme.typingIndicator.text.color};
  ${({ theme }) => theme.typingIndicator.text.css};
`;

const TypingIndicator = (props) => {
  const { Avatar = DefaultAvatar } = props;
  const { client } = useContext(ChatContext);
  const { typing } = useContext(ChannelContext);
  const { t } = useContext(TranslationContext);
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
      <TypingText>
        {constructTypingString({ client, t, typingUsers: typing })}
      </TypingText>
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
