import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { themed } from '../../styles/theme';

const CommandArgs = styled.Text`
  ${({ theme }) => theme.messageInput.suggestions.command.args.css}
`;

const CommandDescription = styled.Text`
  ${({ theme }) => theme.messageInput.suggestions.command.description.css}
`;

const Container = styled.View`
  flex-direction: column;
  padding: 10px;
  ${({ theme }) => theme.messageInput.suggestions.command.container.css}
`;

const Title = styled.Text`
  font-weight: bold;
  ${({ theme }) => theme.messageInput.suggestions.command.title.css}
`;

const Top = styled.View`
  align-items: center;
  flex-direction: row;
  ${({ theme }) => theme.messageInput.suggestions.command.top.css}
`;

/**
 * @example ../docs/CommandsItem.md
 */
const CommandsItem = ({ item: { args, description, name } }) => (
  <Container>
    <Top>
      <Title testID='commands-item-title'>/{name} </Title>
      <CommandArgs testID='commands-item-args'>{args}</CommandArgs>
    </Top>
    <CommandDescription testID='commands-item-description'>
      {description}
    </CommandDescription>
  </Container>
);

CommandsItem.propTypes = {
  item: PropTypes.shape({
    /**
     * Arguments which can be passed to the command
     */
    args: PropTypes.string,
    /**
     * Description of the command
     */
    description: PropTypes.string,
    /**
     * Name of the command
     */
    name: PropTypes.string,
  }),
};

CommandsItem.themePath = 'messageInput.suggestions.command';

export default themed(CommandsItem);
