import React from 'react';
import type { GestureResponderEvent } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../contexts/channelContext/ChannelContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { CircleRight } from '../../icons/CircleRight';

import type { StreamChatGenerics } from '../../types/types';

type MoreOptionsButtonPropsWithContext<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = Pick<ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'disabled'> & {
  /** Function that opens attachment options bottom sheet */
  handleOnPress?: ((event: GestureResponderEvent) => void) & (() => void);
};

const MoreOptionsButtonWithContext = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  props: MoreOptionsButtonPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { disabled, handleOnPress } = props;

  const {
    theme: {
      colors: { accent_blue },
      messageInput: { moreOptionsButton },
    },
  } = useTheme();

  return (
    <TouchableOpacity
      disabled={disabled}
      hitSlop={{ bottom: 15, left: 15, right: 15, top: 15 }}
      onPress={handleOnPress}
      style={[moreOptionsButton]}
      testID='more-options-button'
    >
      <CircleRight pathFill={accent_blue} />
    </TouchableOpacity>
  );
};

const areEqual = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: MoreOptionsButtonPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: MoreOptionsButtonPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { disabled: prevDisabled, handleOnPress: prevHandleOnPress } = prevProps;
  const { disabled: nextDisabled, handleOnPress: nextHandleOnPress } = nextProps;
  const disabledEqual = prevDisabled === nextDisabled;
  if (!disabledEqual) return false;

  const handleOnPressEqual = prevHandleOnPress === nextHandleOnPress;
  if (!handleOnPressEqual) return false;

  return true;
};

const MemoizedMoreOptionsButton = React.memo(
  MoreOptionsButtonWithContext,
  areEqual,
) as typeof MoreOptionsButtonWithContext;

export type MoreOptionsButtonProps<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = Partial<MoreOptionsButtonPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

/**
 * UI Component for more options button in MessageInput component.
 */
export const MoreOptionsButton = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  props: MoreOptionsButtonProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { disabled = false } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();

  return <MemoizedMoreOptionsButton {...{ disabled }} {...props} />;
};

MoreOptionsButton.displayName = 'MoreOptionsButton{messageInput}';
