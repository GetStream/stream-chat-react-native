import React from 'react';
import { Text } from 'react-native';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';
import { themed } from '../styles/theme';

const Container = styled.View`
  flex-direction: column;
  padding: 10px;
  ${({ theme }) => theme.messageInput.suggestions.command.container.css}
`;

const Top = styled.View`
  flex-direction: row;
  align-items: center;
  ${({ theme }) => theme.messageInput.suggestions.command.top.css}
`;

const Title = styled.Text`
  font-weight: bold;
  ${({ theme }) => theme.messageInput.suggestions.command.title.css}
`;

const CommandArgs = styled.Text`
  ${({ theme }) => theme.messageInput.suggestions.command.args.css}
`;

const CommandDescription = styled.Text`
  ${({ theme }) => theme.messageInput.suggestions.command.description.css}
`;

/**
 * @example ./docs/CommandsItem.md
 * @extends PureComponent
 */
export const CommandsItem = themed(
  class CommandsItem extends React.Component {
    static themePath = 'messageInput.suggestions.command';
    static propTypes = {
      name: PropTypes.string,
      args: PropTypes.string,
      description: PropTypes.string,
    };

    render() {
      const {
        item: { name, args, description },
      } = this.props;

      return (
        <Container>
          <Top>
            <Title>/{name} </Title>
            <CommandArgs>{args}</CommandArgs>
          </Top>
          <CommandDescription>{description}</CommandDescription>
        </Container>
      );
    }
  },
);
