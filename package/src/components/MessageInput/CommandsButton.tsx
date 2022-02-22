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

import type { DefaultStreamChatGenerics } from '../../types/types';

type CommandsButtonPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ChannelContextValue<StreamChatGenerics>, 'disabled'> &
  Pick<SuggestionsContextValue<StreamChatGenerics>, 'suggestions'> & {
    /** Function that opens commands selector */
    handleOnPress?: ((event: GestureResponderEvent) => void) & (() => void);
  };

const CommandsButtonWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: CommandsButtonPropsWithContext<StreamChatGenerics>,
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

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: CommandsButtonPropsWithContext<StreamChatGenerics>,
  nextProps: CommandsButtonPropsWithContext<StreamChatGenerics>,
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
  const { disabled = false } = useChannelContext<StreamChatGenerics>();
  const { suggestions } = useSuggestionsContext<StreamChatGenerics>();

  return <MemoizedCommandsButton {...{ disabled, suggestions }} {...props} />;
};

CommandsButton.displayName = 'CommandsButton{messageInput}';
