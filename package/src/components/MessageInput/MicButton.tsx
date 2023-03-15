import React from 'react';
import type { GestureResponderEvent } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../contexts/channelContext/ChannelContext';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Mic } from '../../icons/Mic';

import type { DefaultStreamChatGenerics } from '../../types/types';

type MicButtonPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ChannelContextValue<StreamChatGenerics>, 'disabled'> &
  Pick<MessageInputContextValue<StreamChatGenerics>, 'showVoiceUI' | 'setShowVoiceUI'> & {
    /** Function that opens audio selector */
    handleOnPress?: ((event: GestureResponderEvent) => void) & (() => void);
  };

const MicButtonWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MicButtonPropsWithContext<StreamChatGenerics>,
) => {
  const { disabled, handleOnPress } = props;

  const {
    theme: {
      colors: { grey },
      messageInput: { commandsButton },
    },
  } = useTheme();

  return (
    <TouchableOpacity
      disabled={disabled}
      hitSlop={{ bottom: 15, left: 5, right: 15, top: 15 }}
      onPress={handleOnPress}
      style={[commandsButton]}
      testID='audio-button'
    >
      <Mic height={25} pathFill={grey} width={19} />
    </TouchableOpacity>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: MicButtonPropsWithContext<StreamChatGenerics>,
  nextProps: MicButtonPropsWithContext<StreamChatGenerics>,
) => {
  const { disabled: prevDisabled, showVoiceUI: prevShowVoiceUI } = prevProps;
  const { disabled: nextDisabled, showVoiceUI: nextShowVoiceUI } = nextProps;

  const disabledEqual = prevDisabled === nextDisabled;
  if (!disabledEqual) return false;

  const showVoiceUIEqual = prevShowVoiceUI === nextShowVoiceUI;
  if (!showVoiceUIEqual) return false;

  return true;
};

const MemoizedMicButton = React.memo(MicButtonWithContext, areEqual) as typeof MicButtonWithContext;

export type MicButtonProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<MicButtonPropsWithContext<StreamChatGenerics>>;

/**
 * UI Component for attach button in MessageInput component.
 */
export const MicButton = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MicButtonProps<StreamChatGenerics>,
) => {
  const { disabled = false } = useChannelContext<StreamChatGenerics>();
  const { setShowVoiceUI, showVoiceUI } = useMessageInputContext<StreamChatGenerics>();

  return <MemoizedMicButton {...{ disabled, setShowVoiceUI, showVoiceUI }} {...props} />;
};

MicButton.displayName = 'MicButton{messageInput}';
