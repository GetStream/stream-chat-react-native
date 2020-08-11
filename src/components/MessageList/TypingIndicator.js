import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import styled from '@stream-io/styled-components';

import { Avatar as DefaultAvatar } from '../Avatar';
import { themed } from '../../styles/theme';
import { TranslationContext, ChatContext, ChannelContext } from '../../context';

const TypingText = styled.Text`
  margin-left: 10px;
  font-size: ${({ theme }) => theme.typingIndicator.text.fontSize}px;
  color: ${({ theme }) => theme.typingIndicator.text.color};
  ${({ theme }) => theme.typingIndicator.text.css};
`;

const Container = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  ${({ theme }) => theme.typingIndicator.container.css};
`;

const constructTypingString = (typingUsers, client, t) => {
  const typingKeys = Object.keys(typingUsers);
  const nonSelfUsers = [];
  typingKeys.forEach((item, i) => {
    if (client.user.id === typingUsers[typingKeys[i]].user.id) {
      return;
    }
    nonSelfUsers.push(
      typingUsers[typingKeys[i]].user.name ||
        typingUsers[typingKeys[i]].user.id,
    );
  });

  let outStr = '';
  if (nonSelfUsers.length === 1) {
    outStr = t('{{ user }} is typing...', { user: nonSelfUsers[0] });
  } else if (nonSelfUsers.length === 2) {
    //joins all with "and" but =no commas
    //example: "bob and sam"
    outStr = t('{{ firstUser }} and {{ secondUser }} are typing...', {
      firstUser: nonSelfUsers[0],
      secondUser: nonSelfUsers[1],
    });
  } else if (nonSelfUsers.length > 2) {
    //joins all with commas, but last one gets ", and" (oxford comma!)
    //example: "bob, joe, and sam"
    outStr = t('{{ commaSeparatedUsers }} and {{ lastUser }} are typing...', {
      commaSeparatedUsers: nonSelfUsers.slice(0, -1).join(', '),
      lastUser: nonSelfUsers.slice(-1),
    });
  }

  return outStr;
};

const TypingIndicator = (props) => {
  const { Avatar = DefaultAvatar } = props;
  const { client } = useContext(ChatContext);
  const { typing } = useContext(ChannelContext);
  const { t } = useContext(TranslationContext);
  const typingUsers = Object.values(typing);

  return (
    <Container testID={'typing-indicator'}>
      {typingUsers
        .filter(({ user }) => user.id !== client.user.id)
        .map(({ user }, idx) => (
          <Avatar
            testID={'typing-avatar-' + idx}
            image={user.image}
            size={24}
            name={user.name || user.id}
            key={user.id + idx}
          />
        ))}
      <TypingText>{constructTypingString(typing, client, t)}</TypingText>
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
