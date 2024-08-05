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

import type { DefaultStreamChatGenerics } from '../../types/types';

type CommandsButtonPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<SuggestionsContextValue<StreamChatGenerics>, 'suggestions'> & {
  /** Function that opens commands selector */
  handleOnPress?: ((event: GestureResponderEvent) => void) & (() => void);
};

const CommandsButtonWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: CommandsButtonPropsWithContext<StreamChatGenerics>,
) => {
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
          suggestions && suggestions.data.some((suggestion) => isSuggestionCommand(suggestion))
            ? accent_blue
            : grey
        }
        size={32}
      />
    </Pressable>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: CommandsButtonPropsWithContext<StreamChatGenerics>,
  nextProps: CommandsButtonPropsWithContext<StreamChatGenerics>,
) => {
  const { suggestions: prevSuggestions } = prevProps;
  const { suggestions: nextSuggestions } = nextProps;

  const suggestionsEqual = !!prevSuggestions === !!nextSuggestions;
  if (!suggestionsEqual) return false;

  return true;
};

const MemoizedCommandsButton = React.memo(
  CommandsButtonWithContext,
  areEqual,
) as typeof CommandsButtonWithContext;

export type CommandsButtonProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<CommandsButtonPropsWithContext<StreamChatGenerics>>;

/**
 * UI Component for attach button in MessageInput component.
 */
export const CommandsButton = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: CommandsButtonProps<StreamChatGenerics>,
) => {
  const { suggestions } = useSuggestionsContext<StreamChatGenerics>();

  return <MemoizedCommandsButton {...{ suggestions }} {...props} />;
};

CommandsButton.displayName = 'CommandsButton{messageInput}';
