import React from 'react';
import { Avatar } from './Avatar';

import styled from '@stream-io/styled-components';

const Container = styled.View`
  flex-direction: ${(props) =>
    props.theme.mentionsItem.container.flexDirection};
  align-items: ${(props) => props.theme.mentionsItem.container.alignItems};
  padding: 10px;
`;

const Name = styled.Text`
  padding: ${(props) => props.theme.mentionsItem.name.padding}px;
  color: ${(props) => props.theme.mentionsItem.name.color};
  font-weight: ${(props) => props.theme.mentionsItem.name.fontWeight};
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
