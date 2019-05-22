import React from 'react';
import { Text } from 'react-native';
import styled from 'styled-components';

const Container = styled.View`
  flex-direction: ${(props) =>
    props.theme.commandsItem.container.flexDirection};
  padding: ${(props) => props.theme.commandsItem.container.padding}px;
`;

const Top = styled.View`
  flex-direction: ${(props) => props.theme.commandsItem.top.flexDirection};
  align-items: ${(props) => props.theme.commandsItem.top.alignItems};
`;

const Title = styled.Text`
  font-weight: ${(props) => props.theme.commandsItem.title.fontWeight};
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
