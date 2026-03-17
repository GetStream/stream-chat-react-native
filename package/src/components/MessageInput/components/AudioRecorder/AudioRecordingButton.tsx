import React, { useMemo } from 'react';
import { Alert, Linking, StyleSheet } from 'react-native';

import { Gesture, GestureDetector, State } from 'react-native-gesture-handler';
import Animated, {
  clamp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useActiveAudioPlayer } from '../../../../contexts/audioPlayerContext/AudioPlayerContext';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { useStableCallback } from '../../../../hooks';
import { useStateStore } from '../../../../hooks/useStateStore';
import { Mic } from '../../../../icons/Mic';
import { NativeHandlers } from '../../../../native';
import { AudioRecorderManagerState } from '../../../../state-store/audio-recorder-manager';
import { primitives } from '../../../../theme';
import { ButtonStylesConfig, useButtonStyles } from '../../../ui/Button/hooks/useButtonStyles';
import { useMicPositionContext } from '../../contexts/MicPositionContext';

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
  Pick<AudioRecorderManagerState, 'recording' | 'status'> & {
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
    cancellableDuration: boolean;
  };

const buttonStylesConfig: ButtonStylesConfig = {
  variant: 'secondary',
  type: 'ghost',
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
    cancellableDuration,
    status,
    recording,
  } = props;
  const { micPositionX, micPositionY } = useMicPositionContext();
  const activeAudioPlayer = useActiveAudioPlayer();
  const scale = useSharedValue(1);
  const pressed = useSharedValue(false);

  const { t } = useTranslationContext();
  const {
    theme: {
      messageInput: { micButtonContainer },
      semantics,
    },
  } = useTheme();
  const buttonStyles = useButtonStyles(buttonStylesConfig);

  const onPressHandler = useStableCallback(() => {
    if (handlePress) {
      handlePress();
    }
    if (!recording) {
      NativeHandlers.triggerHaptic('notificationError');
      Alert.alert(t('Hold to start recording.'));
    }
  });

  const onLongPressHandler = useStableCallback(async () => {
    if (handleLongPress) {
      handleLongPress();
      return;
    }
    if (recording) return;
    if (startVoiceRecording) {
      if (activeAudioPlayer?.isPlaying) {
        activeAudioPlayer?.pause();
      }
      const permissionsGranted = await startVoiceRecording();
      if (!permissionsGranted) {
        Alert.alert(t('Please allow Audio permissions in settings.'), '', [
          {
            onPress: () => {
              Linking.openSettings();
            },
            text: t('Open Settings'),
          },
          {
            text: t('Cancel'),
            style: 'cancel',
          },
        ]);
        return;
      }
      NativeHandlers.triggerHaptic('impactHeavy');
    }
  });

  const X_AXIS_POSITION = -asyncMessagesSlideToCancelDistance;
  const Y_AXIS_POSITION = -asyncMessagesLockDistance;

  const micLockHandler = useStableCallback((value: boolean) => {
    if (status === 'recording') {
      audioRecorderManager.micLocked = value;
    }
  });

  const resetAudioRecording = useStableCallback(async () => {
    NativeHandlers.triggerHaptic('notificationSuccess');
    await deleteVoiceRecording();
  });

  const onEarlyReleaseHandler = useStableCallback(() => {
    NativeHandlers.triggerHaptic('notificationError');
    resetAudioRecording();
  });

  const onTouchGestureEnd = useStableCallback(() => {
    if (cancellableDuration) {
      onEarlyReleaseHandler();
      return;
    }
    if (status === 'recording') {
      uploadVoiceRecording(asyncMessagesMultiSendEnabled);
    } else {
      resetAudioRecording();
    }
  });

  const tapGesture = useMemo(
    () =>
      Gesture.LongPress()
        .minDuration(asyncMessagesMinimumPressDuration)
        .onBegin(() => {
          scale.value = withSpring(0.8, { mass: 0.5 });
          pressed.value = true;
        })
        .onStart(() => {
          runOnJS(onLongPressHandler)();
        })
        .onFinalize((e) => {
          scale.value = withSpring(1, { mass: 0.5 });
          pressed.value = false;
          if (e.state === State.FAILED) {
            runOnJS(onPressHandler)();
          }
        }),
    [asyncMessagesMinimumPressDuration, onLongPressHandler, onPressHandler, scale, pressed],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(asyncMessagesMinimumPressDuration)
        .onUpdate((e) => {
          micPositionX.value = clamp(e.translationX, X_AXIS_POSITION, 0);
          micPositionY.value = clamp(e.translationY, Y_AXIS_POSITION, 0);
        })
        .onStart(() => {
          micPositionX.value = 0;
          micPositionY.value = 0;
        })
        .onEnd(() => {
          const belowThresholdY = micPositionY.value > Y_AXIS_POSITION / 2;
          const belowThresholdX = micPositionX.value > X_AXIS_POSITION / 2;

          if (belowThresholdY && belowThresholdX) {
            micPositionY.value = withSpring(0);
            micPositionX.value = withSpring(0);
            runOnJS(onTouchGestureEnd)();
            return;
          }

          if (!belowThresholdX) {
            micPositionX.value = withSpring(X_AXIS_POSITION);
            runOnJS(resetAudioRecording)();
          } else if (!belowThresholdY) {
            micPositionY.value = withSpring(Y_AXIS_POSITION);
            runOnJS(micLockHandler)(true);
          }

          micPositionX.value = 0;
          micPositionY.value = 0;
        }),
    [
      X_AXIS_POSITION,
      Y_AXIS_POSITION,
      asyncMessagesMinimumPressDuration,
      micLockHandler,
      micPositionX,
      micPositionY,
      onTouchGestureEnd,
      resetAudioRecording,
    ],
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      backgroundColor: pressed.value ? semantics.backgroundUtilityPressed : 'transparent',
    };
  });

  return (
    <GestureDetector gesture={Gesture.Simultaneous(panGesture, tapGesture)}>
      <Animated.View style={[styles.container, animatedStyle, micButtonContainer]}>
        <Mic height={20} width={20} strokeWidth={1.5} stroke={buttonStyles.foregroundColor} />
      </Animated.View>
    </GestureDetector>
  );
};

export type AudioRecordingButtonProps = Partial<AudioRecordingButtonPropsWithContext>;

const MemoizedAudioRecordingButton = React.memo(
  AudioRecordingButtonWithContext,
) as typeof AudioRecordingButtonWithContext;

const audioRecorderSelector = (state: AudioRecorderManagerState) => ({
  cancellableDuration: state.duration < 300,
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

  const { cancellableDuration, status, recording } = useStateStore(
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
        cancellableDuration,
        status,
        recording,
      }}
      {...props}
    />
  );
};

AudioRecordingButton.displayName = 'AudioRecordingButton{messageInput}';

const styles = StyleSheet.create({
  container: {
    borderRadius: primitives.radiusMax,
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    width: 32,
  },
});
