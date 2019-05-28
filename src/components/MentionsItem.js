import React from 'react';
import { Avatar } from './Avatar';

import styled from '@stream-io/styled-components';
import { themed } from '../styles/theme';

const Container = styled.View`
  flex-direction: ${({ theme }) => theme.mentionsItem.container.flexDirection};
  align-items: ${({ theme }) => theme.mentionsItem.container.alignItems};
  padding: 10px;
  ${({ theme }) => theme.mentionsItem.container.extra}
`;

const Name = styled.Text`
  padding: ${({ theme }) => theme.mentionsItem.name.padding}px;
  color: ${({ theme }) => theme.mentionsItem.name.color};
  font-weight: ${({ theme }) => theme.mentionsItem.name.fontWeight};
  ${({ theme }) => theme.mentionsItem.name.extra}
`;

export const MentionsItem = themed(
  class MentionsItem extends React.Component {
    static themePath = 'mentionsItem';
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
