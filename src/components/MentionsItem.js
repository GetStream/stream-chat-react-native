import React from 'react';
import { Avatar } from './Avatar';
import { getTheme } from '../styles/theme';

import styled from '@stream-io/styled-components';

const Container = styled.View`
  flex-direction: ${(props) =>
    getTheme(props).mentionsItem.container.flexDirection};
  align-items: ${(props) => getTheme(props).mentionsItem.container.alignItems};
  padding: 10px;
`;

const Name = styled.Text`
  padding: ${(props) => getTheme(props).mentionsItem.name.padding}px;
  color: ${(props) => getTheme(props).mentionsItem.name.color};
  font-weight: ${(props) => getTheme(props).mentionsItem.name.fontWeight};
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
