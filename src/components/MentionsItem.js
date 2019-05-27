import React from 'react';
import { Avatar } from './Avatar';

import styled from '@stream-io/styled-components';

const Container = styled.View`
  flex-direction: ${({ theme }) => theme.mentionsItem.container.flexDirection};
  align-items: ${({ theme }) => theme.mentionsItem.container.alignItems};
  padding: 10px;
`;

const Name = styled.Text`
  padding: ${({ theme }) => theme.mentionsItem.name.padding}px;
  color: ${({ theme }) => theme.mentionsItem.name.color};
  font-weight: ${({ theme }) => theme.mentionsItem.name.fontWeight};
`;

export class MentionsItem extends React.Component {
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
}
