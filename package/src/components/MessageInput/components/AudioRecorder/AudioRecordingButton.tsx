import React from 'react';
import { Alert, Linking, Pressable, StyleSheet } from 'react-native';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../../../contexts/channelContext/ChannelContext';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { Mic } from '../../../../icons/Mic';
import { triggerHaptic } from '../../../../native';

import type { DefaultStreamChatGenerics } from '../../../../types/types';

type AudioRecordingButtonPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ChannelContextValue<StreamChatGenerics>, 'disabled'> &
  Pick<MessageInputContextValue<StreamChatGenerics>, 'asyncMessagesMinimumPressDuration'> & {
    buttonSize?: number;
    /** Function that opens audio selector */
    handleLongPress?: () => void;
    handlePress?: () => void;
    permissionsGranted?: boolean;
    showVoiceUI?: boolean;
    startVoiceRecording?: () => Promise<void>;
  };

const AudioRecordingButtonWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: AudioRecordingButtonPropsWithContext<StreamChatGenerics>,
) => {
  const {
    asyncMessagesMinimumPressDuration,
    buttonSize,
    disabled,
    handleLongPress,
    handlePress,
    permissionsGranted,
    showVoiceUI,
    startVoiceRecording,
  } = props;

  const {
    theme: {
      colors: { grey, light_gray, white },
      messageInput: {
        audioRecordingButton: { container, micIcon },
      },
    },
  } = useTheme();
  const { t } = useTranslationContext();

  const onPressHandler = () => {
    if (handlePress) {
      handlePress();
    }
    if (!showVoiceUI) {
      triggerHaptic('notificationError');
      Alert.alert(t('Hold to start recording.'));
    }
  };

  const onLongPressHandler = () => {
    if (handleLongPress) {
      handleLongPress();
      return;
    }
    if (!showVoiceUI) {
      triggerHaptic('impactHeavy');
      if (!permissionsGranted) {
        Alert.alert(t('Please allow Audio permissions in settings.'), '', [
          {
            onPress: () => {
              Linking.openSettings();
            },
            text: t('Open Setting'),
          },
        ]);
        return;
      }
      if (startVoiceRecording) startVoiceRecording();
    }
  };

  return (
    <Pressable
      delayLongPress={asyncMessagesMinimumPressDuration}
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
        container,
      ]}
      testID='audio-button'
    >
      <Mic fill={grey} size={32} {...micIcon} />
    </Pressable>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: AudioRecordingButtonPropsWithContext<StreamChatGenerics>,
  nextProps: AudioRecordingButtonPropsWithContext<StreamChatGenerics>,
) => {
  const {
    asyncMessagesMinimumPressDuration: prevAsyncMessagesMinimumPressDuration,
    disabled: prevDisabled,
  } = prevProps;
  const {
    asyncMessagesMinimumPressDuration: nextAsyncMessagesMinimumPressDuration,
    disabled: nextDisabled,
  } = nextProps;

  const asyncMessagesMinimumPressDurationEqual =
    prevAsyncMessagesMinimumPressDuration === nextAsyncMessagesMinimumPressDuration;
  if (!asyncMessagesMinimumPressDurationEqual) return false;

  const disabledEqual = prevDisabled === nextDisabled;
  if (!disabledEqual) return false;

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
  const { asyncMessagesMinimumPressDuration } = useMessageInputContext<StreamChatGenerics>();

  return (
    <MemoizedAudioRecordingButton {...{ asyncMessagesMinimumPressDuration, disabled }} {...props} />
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 50,
    justifyContent: 'center',
  },
});

AudioRecordingButton.displayName = 'AudioRecordingButton{messageInput}';
