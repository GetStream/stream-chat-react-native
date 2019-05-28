import React from 'react';
import { Text } from 'react-native';
import styled from '@stream-io/styled-components';

const Container = styled.View`
  flex-direction: ${({ theme }) => theme.commandsItem.container.flexDirection};
  padding: ${({ theme }) => theme.commandsItem.container.padding}px;
  ${({ theme }) => theme.commandsItem.container.extra}
`;

const Top = styled.View`
  flex-direction: ${({ theme }) => theme.commandsItem.top.flexDirection};
  align-items: ${({ theme }) => theme.commandsItem.top.alignItems};
  ${({ theme }) => theme.commandsItem.top.extra}
`;

const Title = styled.Text`
  font-weight: ${({ theme }) => theme.commandsItem.title.fontWeight};
  ${({ theme }) => theme.commandsItem.title.extra}
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
