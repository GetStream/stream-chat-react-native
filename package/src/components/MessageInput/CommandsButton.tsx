import React from 'react';
import type { GestureResponderEvent } from 'react-native';
import { Pressable } from 'react-native';

import {
  isSuggestionCommand,
  SuggestionsContextValue,
  useSuggestionsContext,
} from '../../contexts/suggestionsContext/SuggestionsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Lightning } from '../../icons/Lightning';

type CommandsButtonPropsWithContext = Pick<SuggestionsContextValue, 'suggestions'> & {
  /** Function that opens commands selector */
  handleOnPress?: ((event: GestureResponderEvent) => void) & (() => void);
};

const CommandsButtonWithContext = (props: CommandsButtonPropsWithContext) => {
  const { handleOnPress, suggestions } = props;

  const {
    theme: {
      colors: { accent_blue, grey },
      messageInput: { commandsButton },
    },
  } = useTheme();

  return (
    <Pressable onPress={handleOnPress} style={[commandsButton]} testID='commands-button'>
      <Lightning
        fill={
          suggestions && suggestions.some((suggestion) => isSuggestionCommand(suggestion))
            ? accent_blue
            : grey
        }
        size={32}
      />
    </Pressable>
  );
};

const areEqual = (
  prevProps: CommandsButtonPropsWithContext,
  nextProps: CommandsButtonPropsWithContext,
) => {
  const { suggestions: prevSuggestions } = prevProps;
  const { suggestions: nextSuggestions } = nextProps;

  const suggestionsEqual = !!prevSuggestions === !!nextSuggestions;
  if (!suggestionsEqual) {
    return false;
  }

  return true;
};

const MemoizedCommandsButton = React.memo(
  CommandsButtonWithContext,
  areEqual,
) as typeof CommandsButtonWithContext;

export type CommandsButtonProps = Partial<CommandsButtonPropsWithContext>;

/**
 * UI Component for attach button in MessageInput component.
 */
export const CommandsButton = (props: CommandsButtonProps) => {
  const { suggestions } = useSuggestionsContext();

  return <MemoizedCommandsButton {...{ suggestions }} {...props} />;
};

CommandsButton.displayName = 'CommandsButton{messageInput}';
