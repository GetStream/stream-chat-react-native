import React from 'react';
import { Avatar } from './Avatar';

import styled from '@stream-io/styled-components';
import { themed } from '../styles/theme';

const Container = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 10px;
  ${({ theme }) => theme.messageInput.suggestions.mention.container.extra}
`;

const Name = styled.Text`
  padding: 10px;
  color: black;
  font-weight: bold;
  ${({ theme }) => theme.messageInput.suggestions.mention.name.extra}
`;

export const MentionsItem = themed(
  class MentionsItem extends React.Component {
    static themePath = 'messageInput.suggestions.mention';
    render() {
      const {
        item: { name, icon, id },
      } = this.props;
      return (
        <Container>
          <Avatar image={icon} />
          <Name>{name || id}</Name>
        </Container>
      );
    }
  },
);
