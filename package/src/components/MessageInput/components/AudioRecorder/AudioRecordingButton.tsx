import React from 'react';
import { Alert, Linking, StyleSheet } from 'react-native';

import {
  Gesture,
  GestureDetector,
  PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { IconButton } from '../../../../components/ui/IconButton';
import { useActiveAudioPlayer } from '../../../../contexts/audioPlayerContext/AudioPlayerContext';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { useStateStore } from '../../../../hooks/useStateStore';
import { NewMic } from '../../../../icons/NewMic';
import { NativeHandlers } from '../../../../native';
import { AudioRecorderManagerState } from '../../../../state-store/audio-recorder-manager';

export type AudioRecordingButtonPropsWithContext = Pick<
  MessageInputContextValue,
  | 'asyncMessagesMinimumPressDuration'
  | 'asyncMessagesSlideToCancelDistance'
  | 'asyncMessagesLockDistance'
  | 'asyncMessagesMultiSendEnabled'
  | 'audioRecorderManager'
  | 'startVoiceRecording'
  | 'deleteVoiceRecording'
  | 'uploadVoiceRecording'
> &
  Pick<AudioRecorderManagerState, 'duration' | 'recording' | 'status' | 'permissionsGranted'> & {
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
    micPositionX: SharedValue<number>;
    micPositionY: SharedValue<number>;
  };

/**
 * Component to display the mic button on the Message Input.
 */
export const AudioRecordingButtonWithContext = (props: AudioRecordingButtonPropsWithContext) => {
  const {
    audioRecorderManager,
    asyncMessagesMinimumPressDuration,
    asyncMessagesSlideToCancelDistance,
    asyncMessagesLockDistance,
    asyncMessagesMultiSendEnabled,
    startVoiceRecording,
    deleteVoiceRecording,
    uploadVoiceRecording,
    handleLongPress,
    handlePress,
    micPositionX,
    micPositionY,
    permissionsGranted,
    duration: recordingDuration,
    status,
    recording,
  } = props;
  const activeAudioPlayer = useActiveAudioPlayer();
  const scale = useSharedValue(1);

  const { t } = useTranslationContext();
  const {
    theme: {
      messageInput: { micButtonContainer },
    },
  } = useTheme();

  const onPressHandler = () => {
    if (handlePress) {
      handlePress();
    }
    if (!recording) {
      NativeHandlers.triggerHaptic('notificationError');
      Alert.alert(t('Hold to start recording.'));
    }
  };

  const onLongPressHandler = async () => {
    if (handleLongPress) {
      handleLongPress();
      return;
    }
    if (recording) return;
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
      if (activeAudioPlayer?.isPlaying) {
        await activeAudioPlayer?.pause();
      }
      await startVoiceRecording();
    }
  };
  const X_AXIS_POSITION = -asyncMessagesSlideToCancelDistance;
  const Y_AXIS_POSITION = -asyncMessagesLockDistance;

  const micUnlockHandler = () => {
    audioRecorderManager.micLocked = false;
  };

  const micLockHandler = (value: boolean) => {
    audioRecorderManager.micLocked = value;
  };

  const resetAudioRecording = async () => {
    NativeHandlers.triggerHaptic('notificationSuccess');
    await deleteVoiceRecording();
  };

  const onEarlyReleaseHandler = () => {
    NativeHandlers.triggerHaptic('notificationError');
    resetAudioRecording();
  };

  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(0.8, { mass: 0.5 });
    })
    .onEnd(() => {
      scale.value = withSpring(1, { mass: 0.5 });
    });

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(asyncMessagesMinimumPressDuration + 100)
    .onChange((event: PanGestureHandlerEventPayload) => {
      const newPositionX = event.translationX;
      const newPositionY = event.translationY;

      if (newPositionX <= 0 && newPositionX >= X_AXIS_POSITION) {
        micPositionX.value = newPositionX;
      }
      if (newPositionY <= 0 && newPositionY >= Y_AXIS_POSITION) {
        micPositionY.value = newPositionY;
      }
    })
    .onStart(() => {
      micPositionX.value = 0;
      micPositionY.value = 0;
      runOnJS(micUnlockHandler)();
    })
    .onEnd(() => {
      const belowThresholdY = micPositionY.value > Y_AXIS_POSITION / 2;
      const belowThresholdX = micPositionX.value > X_AXIS_POSITION / 2;

      if (belowThresholdY && belowThresholdX) {
        micPositionY.value = withSpring(0);
        micPositionX.value = withSpring(0);
        if (status === 'recording') {
          if (recordingDuration < 300) {
            runOnJS(onEarlyReleaseHandler)();
          } else {
            runOnJS(uploadVoiceRecording)(asyncMessagesMultiSendEnabled);
          }
        }
        return;
      }

      if (!belowThresholdY) {
        micPositionY.value = withSpring(Y_AXIS_POSITION);
        runOnJS(micLockHandler)(true);
      }

      if (!belowThresholdX) {
        micPositionX.value = withSpring(X_AXIS_POSITION);
        runOnJS(resetAudioRecording)();
      }

      micPositionX.value = 0;
      micPositionY.value = 0;
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <GestureDetector gesture={Gesture.Simultaneous(panGesture, tapGesture)}>
      <Animated.View style={[styles.container, animatedStyle, micButtonContainer]}>
        <IconButton
          accessibilityLabel='Start recording'
          category='ghost'
          delayLongPress={asyncMessagesMinimumPressDuration}
          Icon={NewMic}
          onLongPress={onLongPressHandler}
          onPress={onPressHandler}
          size='sm'
          type='secondary'
        />
      </Animated.View>
    </GestureDetector>
  );
};

export type AudioRecordingButtonProps = Partial<AudioRecordingButtonPropsWithContext> & {
  micPositionX: SharedValue<number>;
  micPositionY: SharedValue<number>;
};

const MemoizedAudioRecordingButton = React.memo(
  AudioRecordingButtonWithContext,
) as typeof AudioRecordingButtonWithContext;

const audioRecorderSelector = (state: AudioRecorderManagerState) => ({
  duration: state.duration,
  permissionsGranted: state.permissionsGranted,
  recording: state.recording,
  status: state.status,
});

export const AudioRecordingButton = (props: AudioRecordingButtonProps) => {
  const {
    audioRecorderManager,
    asyncMessagesMinimumPressDuration,
    asyncMessagesSlideToCancelDistance,
    asyncMessagesLockDistance,
    asyncMessagesMultiSendEnabled,
    startVoiceRecording,
    deleteVoiceRecording,
    uploadVoiceRecording,
  } = useMessageInputContext();

  const { duration, status, permissionsGranted, recording } = useStateStore(
    audioRecorderManager.state,
    audioRecorderSelector,
  );

  return (
    <MemoizedAudioRecordingButton
      {...{
        audioRecorderManager,
        asyncMessagesMinimumPressDuration,
        asyncMessagesSlideToCancelDistance,
        asyncMessagesLockDistance,
        asyncMessagesMultiSendEnabled,
        startVoiceRecording,
        deleteVoiceRecording,
        uploadVoiceRecording,
        duration,
        status,
        permissionsGranted,
        recording,
      }}
      {...props}
    />
  );
};

AudioRecordingButton.displayName = 'AudioRecordingButton{messageInput}';

const styles = StyleSheet.create({
  container: {},
});
