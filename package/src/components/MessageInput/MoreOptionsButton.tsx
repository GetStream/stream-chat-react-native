import React from 'react';
import type { GestureResponderEvent } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../contexts/channelContext/ChannelContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { CircleRight } from '../../icons/CircleRight';

import type { DefaultStreamChatGenerics } from '../../types/types';

type MoreOptionsButtonPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ChannelContextValue<StreamChatGenerics>, 'disabled'> & {
  /** Function that opens attachment options bottom sheet */
  handleOnPress?: ((event: GestureResponderEvent) => void) & (() => void);
};

const MoreOptionsButtonWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MoreOptionsButtonPropsWithContext<StreamChatGenerics>,
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

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: MoreOptionsButtonPropsWithContext<StreamChatGenerics>,
  nextProps: MoreOptionsButtonPropsWithContext<StreamChatGenerics>,
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

export type MoreOptionsButtonProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<MoreOptionsButtonPropsWithContext<StreamChatGenerics>>;

/**
 * UI Component for more options button in MessageInput component.
 */
export const MoreOptionsButton = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MoreOptionsButtonProps<StreamChatGenerics>,
) => {
  const { disabled = false } = useChannelContext<StreamChatGenerics>();

  return <MemoizedMoreOptionsButton {...{ disabled }} {...props} />;
};

MoreOptionsButton.displayName = 'MoreOptionsButton{messageInput}';
