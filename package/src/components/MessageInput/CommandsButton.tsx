import React from 'react';
import type { GestureResponderEvent } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

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

import type { StreamChatGenerics } from '../../types/types';

type CommandsButtonPropsWithContext<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = Pick<ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'disabled'> &
  Pick<SuggestionsContextValue<Co, Us>, 'suggestions'> & {
    /** Function that opens commands selector */
    handleOnPress?: ((event: GestureResponderEvent) => void) & (() => void);
  };

const CommandsButtonWithContext = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  props: CommandsButtonPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
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

const areEqual = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: CommandsButtonPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: CommandsButtonPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
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

export type CommandsButtonProps<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = Partial<CommandsButtonPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

/**
 * UI Component for attach button in MessageInput component.
 */
export const CommandsButton = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  props: CommandsButtonProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { disabled = false } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { suggestions } = useSuggestionsContext<Co, Us>();

  return <MemoizedCommandsButton {...{ disabled, suggestions }} {...props} />;
};

CommandsButton.displayName = 'CommandsButton{messageInput}';
