import React from 'react';
import { Text } from 'react-native';
import styled from '@stream-io/styled-components';

const Container = styled.View`
  flex-direction: column;
  padding: 10px;
  ${({ theme }) => theme.commandsItem.container.extra}
`;

const Top = styled.View`
  flex-direction: row;
  align-items: center;
  ${({ theme }) => theme.commandsItem.top.extra}
`;

const Title = styled.Text`
  font-weight: bold;
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
