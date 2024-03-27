import React from 'react';
import {
  GestureResponderEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import Animated from 'react-native-reanimated';

import dayjs from 'dayjs';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../../../contexts/channelContext/ChannelContext';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { ArrowLeft, CircleStop, Delete, Mic, SendCheck } from '../../../../icons';

import type { DefaultStreamChatGenerics } from '../../../../types/types';

type AudioRecorderPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ChannelContextValue<StreamChatGenerics>, 'disabled'> &
  Pick<
    MessageInputContextValue<StreamChatGenerics>,
    'micLocked' | 'recording' | 'recordingDuration' | 'recordingStopped'
  > & {
    deleteVoiceRecording?: () => Promise<void>;
    /** Function that opens audio selector */
    handleOnPress?: ((event: GestureResponderEvent) => void) & (() => void);
    slideToCancelStyle?: StyleProp<ViewStyle>;
    stopVoiceRecording?: () => Promise<void>;
    uploadVoiceRecording?: () => Promise<void>;
  };

const AudioRecorderWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: AudioRecorderPropsWithContext<StreamChatGenerics>,
) => {
  const {
    deleteVoiceRecording,
    disabled,
    micLocked,
    recordingDuration,
    recordingStopped,
    slideToCancelStyle,
    stopVoiceRecording,
    uploadVoiceRecording,
  } = props;

  const {
    theme: {
      colors: { accent_blue, accent_red, grey_dark },
    },
  } = useTheme();

  return (
    <>
      {recordingStopped !== undefined ? (
        recordingStopped ? (
          <Pressable disabled={disabled} onPress={deleteVoiceRecording} testID='delete-button'>
            <Delete fill={accent_blue} size={32} />
          </Pressable>
        ) : (
          <View style={[styles.micContainer]}>
            <Mic fill={recordingDuration !== 0 ? accent_red : grey_dark} size={32} />
            {/* `durationMillis` is for Expo apps, `currentPosition` is for Native CLI apps. */}
            {!micLocked && (
              <Text style={[styles.durationLabel, { color: grey_dark }]}>
                {recordingDuration ? dayjs.duration(recordingDuration).format('mm:ss') : null}
              </Text>
            )}
          </View>
        )
      ) : null}
      {micLocked ? (
        !recordingStopped && (
          <Pressable onPress={stopVoiceRecording} style={styles.pausedContainer}>
            <CircleStop fill={accent_red} size={32} />
          </Pressable>
        )
      ) : (
        <Animated.View style={[styles.slideToCancelContainer, slideToCancelStyle]}>
          <Text style={[styles.slideToCancel, { color: grey_dark }]}>Slide to Cancel</Text>
          <ArrowLeft fill={grey_dark} size={24} />
        </Animated.View>
      )}
      {micLocked ? (
        <Pressable onPress={uploadVoiceRecording} style={styles.checkContainer}>
          <SendCheck fill={accent_blue} size={32} />
        </Pressable>
      ) : null}
    </>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: AudioRecorderPropsWithContext<StreamChatGenerics>,
  nextProps: AudioRecorderPropsWithContext<StreamChatGenerics>,
) => {
  const {
    disabled: prevDisabled,
    micLocked: prevMicLocked,
    recording: prevRecording,
    recordingDuration: prevRecordingDuration,
    recordingStopped: prevRecordingStopped,
  } = prevProps;
  const {
    disabled: nextDisabled,
    micLocked: nextMicLocked,
    recording: nextRecording,
    recordingDuration: nextRecordingDuration,
    recordingStopped: nextRecordingStopped,
  } = nextProps;

  const disabledEqual = prevDisabled === nextDisabled;
  if (!disabledEqual) return false;

  const micLockedEqual = prevMicLocked === nextMicLocked;
  if (!micLockedEqual) return false;

  const recordingEqual = prevRecording === nextRecording;
  if (!recordingEqual) return false;

  const recordingDurationEqual = prevRecordingDuration === nextRecordingDuration;
  if (!recordingDurationEqual) return false;

  const recordingStoppedEqual = prevRecordingStopped === nextRecordingStopped;
  if (!recordingStoppedEqual) return false;

  return true;
};

const MemoizedAudioRecorder = React.memo(
  AudioRecorderWithContext,
  areEqual,
) as typeof AudioRecorderWithContext;

export type AudioRecorderProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<AudioRecorderPropsWithContext<StreamChatGenerics>>;

/**
 * UI Component for attach button in MessageInput component.
 */
export const AudioRecorder = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: AudioRecorderProps<StreamChatGenerics>,
) => {
  const { disabled = false } = useChannelContext<StreamChatGenerics>();
  const { micLocked, recording, recordingDuration, recordingStopped } =
    useMessageInputContext<StreamChatGenerics>();

  return (
    <MemoizedAudioRecorder
      {...{
        disabled,
        micLocked,
        recording,
        recordingDuration,
        recordingStopped,
      }}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  checkContainer: {},
  durationLabel: {
    fontSize: 14,
  },
  micContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  pausedContainer: {},
  slideToCancel: {
    fontSize: 18,
  },
  slideToCancelContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});

AudioRecorder.displayName = 'AudioRecorder{messageInput}';
