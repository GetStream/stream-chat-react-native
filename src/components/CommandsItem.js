import React from 'react';
import { Text } from 'react-native';
import styled from 'styled-components';
import { getTheme } from '../styles/theme';

const Container = styled.View`
  flex-direction: ${(props) =>
    getTheme(props).commandsItem.container.flexDirection};
  padding: ${(props) => getTheme(props).commandsItem.container.padding}px;
`;

const Top = styled.View`
  flex-direction: ${(props) => getTheme(props).commandsItem.top.flexDirection};
  align-items: ${(props) => getTheme(props).commandsItem.top.alignItems};
`;

const Title = styled.Text`
  font-weight: ${(props) => getTheme(props).commandsItem.title.fontWeight};
`;

export class CommandsItem extends React.Component {
  render() {
    const {
      item: { name, args, description },
    } = this.props;

    return (
      <Container>
        <Top>
          <Title>/{name} </Title>
          <Text>{args}</Text>
        </Top>
        <Text>{description}</Text>
      </Container>
    );
  }
}
