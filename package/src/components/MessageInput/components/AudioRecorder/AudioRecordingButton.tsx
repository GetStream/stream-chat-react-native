import React from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../../../contexts/channelContext/ChannelContext';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { Mic } from '../../../../icons/Mic';
import { triggerHaptic } from '../../../../native';

import type { DefaultStreamChatGenerics } from '../../../../types/types';

type AudioRecordingButtonPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ChannelContextValue<StreamChatGenerics>, 'disabled'> &
  Pick<MessageInputContextValue<StreamChatGenerics>, 'showVoiceUI'> & {
    buttonSize?: number;
    /** Function that opens audio selector */
    handleLongPress?: () => void;
    handlePress?: () => void;
    startVoiceRecording?: () => Promise<void>;
  };

const AudioRecordingButtonWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: AudioRecordingButtonPropsWithContext<StreamChatGenerics>,
) => {
  const { buttonSize, disabled, handleLongPress, handlePress, showVoiceUI, startVoiceRecording } =
    props;

  const {
    theme: {
      colors: { grey, light_gray, white },
    },
  } = useTheme();

  const onPressHandler = () => {
    if (handlePress) {
      handlePress();
    }
    if (!showVoiceUI) {
      triggerHaptic('notificationError');
      Alert.alert('Hold to start recording');
    }
  };

  const onLongPressHandler = () => {
    if (handleLongPress) {
      handleLongPress();
      return;
    }
    if (!showVoiceUI) {
      triggerHaptic('impactHeavy');
      if (startVoiceRecording) startVoiceRecording();
    }
  };

  return (
    <Pressable
      disabled={disabled}
      onLongPress={onLongPressHandler}
      onPress={onPressHandler}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed ? light_gray : white,
          height: buttonSize || 40,
          width: buttonSize || 40,
        },
      ]}
      testID='audio-button'
    >
      <Mic fill={grey} size={32} />
    </Pressable>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: AudioRecordingButtonPropsWithContext<StreamChatGenerics>,
  nextProps: AudioRecordingButtonPropsWithContext<StreamChatGenerics>,
) => {
  const { disabled: prevDisabled, showVoiceUI: prevShowVoiceUI } = prevProps;
  const { disabled: nextDisabled, showVoiceUI: nextShowVoiceUI } = nextProps;

  const disabledEqual = prevDisabled === nextDisabled;
  if (!disabledEqual) return false;

  const showVoiceUIEqual = prevShowVoiceUI === nextShowVoiceUI;
  if (!showVoiceUIEqual) return false;

  return true;
};

const MemoizedAudioRecordingButton = React.memo(
  AudioRecordingButtonWithContext,
  areEqual,
) as typeof AudioRecordingButtonWithContext;

export type AudioRecordingButtonProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<AudioRecordingButtonPropsWithContext<StreamChatGenerics>>;

/**
 * UI Component for attach button in MessageInput component.
 */
export const AudioRecordingButton = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: AudioRecordingButtonProps<StreamChatGenerics>,
) => {
  const { disabled = false } = useChannelContext<StreamChatGenerics>();
  const { showVoiceUI } = useMessageInputContext<StreamChatGenerics>();

  return <MemoizedAudioRecordingButton {...{ disabled, showVoiceUI }} {...props} />;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 50,
    justifyContent: 'center',
  },
});

AudioRecordingButton.displayName = 'AudioRecordingButton{messageInput}';
