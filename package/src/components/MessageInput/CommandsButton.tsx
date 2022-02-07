import React from 'react';
import type { GestureResponderEvent } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import type { ExtendableGenerics } from 'stream-chat';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../contexts/channelContext/ChannelContext';
import {
  isSuggestionCommand,
  SuggestionsContextValue,
  useSuggestionsContext,
} from '../../contexts/suggestionsContext/SuggestionsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Lightning } from '../../icons/Lightning';

import type { DefaultStreamChatGenerics } from '../../types/types';

type CommandsButtonPropsWithContext<
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = Pick<ChannelContextValue<StreamChatClient>, 'disabled'> &
  Pick<SuggestionsContextValue<StreamChatClient>, 'suggestions'> & {
    /** Function that opens commands selector */
    handleOnPress?: ((event: GestureResponderEvent) => void) & (() => void);
  };

const CommandsButtonWithContext = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  props: CommandsButtonPropsWithContext<StreamChatClient>,
) => {
  const { disabled, handleOnPress, suggestions } = props;

  const {
    theme: {
      colors: { accent_blue, grey },
      messageInput: { commandsButton },
    },
  } = useTheme();

  return (
    <TouchableOpacity
      disabled={disabled}
      hitSlop={{ bottom: 15, left: 5, right: 15, top: 15 }}
      onPress={handleOnPress}
      style={[commandsButton]}
      testID='commands-button'
    >
      <Lightning
        pathFill={
          suggestions && suggestions.data.some((suggestion) => isSuggestionCommand(suggestion))
            ? accent_blue
            : grey
        }
      />
    </TouchableOpacity>
  );
};

const areEqual = <StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics>(
  prevProps: CommandsButtonPropsWithContext<StreamChatClient>,
  nextProps: CommandsButtonPropsWithContext<StreamChatClient>,
) => {
  const { disabled: prevDisabled, suggestions: prevSuggestions } = prevProps;
  const { disabled: nextDisabled, suggestions: nextSuggestions } = nextProps;

  const disabledEqual = prevDisabled === nextDisabled;
  if (!disabledEqual) return false;

  const suggestionsEqual = !!prevSuggestions === !!nextSuggestions;
  if (!suggestionsEqual) return false;

  return true;
};

const MemoizedCommandsButton = React.memo(
  CommandsButtonWithContext,
  areEqual,
) as typeof CommandsButtonWithContext;

export type CommandsButtonProps<
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = Partial<CommandsButtonPropsWithContext<StreamChatClient>>;

/**
 * UI Component for attach button in MessageInput component.
 */
export const CommandsButton = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  props: CommandsButtonProps<StreamChatClient>,
) => {
  const { disabled = false } = useChannelContext<StreamChatClient>();
  const { suggestions } = useSuggestionsContext<StreamChatClient>();

  return <MemoizedCommandsButton {...{ disabled, suggestions }} {...props} />;
};

CommandsButton.displayName = 'CommandsButton{messageInput}';
