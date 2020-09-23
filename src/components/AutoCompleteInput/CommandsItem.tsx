import React from 'react';

import { styled } from '../../styles/styledComponents';
import { themed } from '../../styles/theme';

import type { SuggestionCommand } from '../../contexts/suggestionsContext/SuggestionsContext';
import type { DefaultCommandType } from '../../types/types';

const CommandArgs = styled.Text`
  ${({ theme }) => theme.messageInput.suggestions.command.args.css}
`;

const CommandDescription = styled.Text`
  ${({ theme }) => theme.messageInput.suggestions.command.description.css}
`;

const Container = styled.View`
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

export type CommandsItemProps<Co extends string = DefaultCommandType> = {
  /**
   * A CommandResponse of suggested CommandTypes with these properties
   *
   * - args: Arguments which can be passed to the command
   * - description: Description of the command
   * - name: Name of the command
   */
  item: SuggestionCommand<Co>;
};

/**
 * @example ./CommandsItem.md
 */
const CommandsItem = <Co extends string = DefaultCommandType>({
  item: { args, description, name },
}: CommandsItemProps<Co>) => (
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

CommandsItem.themePath = 'messageInput.suggestions.command';

export default themed(CommandsItem);
