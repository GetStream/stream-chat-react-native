import React from 'react';
import { Alert, Linking } from 'react-native';

import { IconButton } from '../../../../components/ui/IconButton';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../../contexts/messageInputContext/MessageInputContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { NewMic } from '../../../../icons/NewMic';
import { AudioRecordingReturnType, NativeHandlers } from '../../../../native';

export type AudioRecordingButtonProps = Partial<
  Pick<MessageInputContextValue, 'asyncMessagesMinimumPressDuration'> & {
    /**
     * The current voice recording that is in progress.
     */
    recording: AudioRecordingReturnType;
    /**
     * Size of the mic button.
     */
    buttonSize?: number;
    /**
     * Handler to determine what should happen on long press of the mic button.
     */
    handleLongPress?: () => void;
    /**
     * Handler to determine what should happen on press of the mic button.
     */
    handlePress?: () => void;
    /**
     * Boolean to determine if the audio recording permissions are granted.
     */
    permissionsGranted?: boolean;
    /**
     * Function to start the voice recording.
     */
    startVoiceRecording?: () => Promise<void>;
  }
>;

/**
 * Component to display the mic button on the Message Input.
 */
export const AudioRecordingButton = (props: AudioRecordingButtonProps) => {
  const {
    asyncMessagesMinimumPressDuration: propAsyncMessagesMinimumPressDuration,
    handleLongPress,
    handlePress,
    permissionsGranted,
    recording,
    startVoiceRecording,
  } = props;
  const { asyncMessagesMinimumPressDuration: contextAsyncMessagesMinimumPressDuration } =
    useMessageInputContext();

  const asyncMessagesMinimumPressDuration =
    propAsyncMessagesMinimumPressDuration || contextAsyncMessagesMinimumPressDuration;

  const { t } = useTranslationContext();

  const onPressHandler = () => {
    if (handlePress) {
      handlePress();
    }
    if (!recording) {
      NativeHandlers.triggerHaptic('notificationError');
      Alert.alert(t('Hold to start recording.'));
    }
  };

  const onLongPressHandler = () => {
    if (handleLongPress) {
      handleLongPress();
      return;
    }
    if (!recording) {
      NativeHandlers.triggerHaptic('impactHeavy');
      if (!permissionsGranted) {
        Alert.alert(t('Please allow Audio permissions in settings.'), '', [
          {
            onPress: () => {
              Linking.openSettings();
            },
            text: t('Open Settings'),
          },
        ]);
        return;
      }
      if (startVoiceRecording) {
        startVoiceRecording();
      }
    }
  };

  return (
    <IconButton
      category='ghost'
      delayLongPress={asyncMessagesMinimumPressDuration}
      Icon={NewMic}
      onLongPress={onLongPressHandler}
      onPress={onPressHandler}
      size='sm'
      type='secondary'
    />
  );
};

AudioRecordingButton.displayName = 'AudioRecordingButton{messageInput}';
