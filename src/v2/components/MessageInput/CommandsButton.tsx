import React from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../contexts/channelContext/ChannelContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Lightning } from '../../icons/Lightning';

import type { GestureResponderEvent } from 'react-native';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

type CommandsButtonPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'disabled'> & {
  /** Function that opens commands selector */
  handleOnPress?: (event: GestureResponderEvent) => void;
};

export const CommandsButtonWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: CommandsButtonPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { disabled, handleOnPress } = props;

  const {
    theme: {
      colors: { textGrey },
      messageInput: { commandsButton },
    },
  } = useTheme();

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={handleOnPress}
      style={[commandsButton]}
      testID='commands-button'
    >
      <Lightning pathFill={textGrey} />
    </TouchableOpacity>
  );
};

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  prevProps: CommandsButtonPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: CommandsButtonPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { disabled: prevDisabled } = prevProps;
  const { disabled: nextDisabled } = nextProps;
  return prevDisabled === nextDisabled;
};

const MemoizedCommandsButton = React.memo(
  CommandsButtonWithContext,
  areEqual,
) as typeof CommandsButtonWithContext;

export type CommandsButtonProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Partial<CommandsButtonPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

/**
 * UI Component for attach button in MessageInput component.
 *
 * @example ./CommandsButton.md
 */
export const CommandsButton = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: CommandsButtonProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { disabled = false } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();

  return <MemoizedCommandsButton {...{ disabled }} {...props} />;
};

CommandsButton.displayName = 'CommandsButton{messageInput}';
