import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import Animated from 'react-native-reanimated';

import dayjs from 'dayjs';

import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { ArrowLeft, CircleStop, Delete, Mic, SendCheck } from '../../../../icons';

import { AudioRecordingReturnType } from '../../../../native';
import type { DefaultStreamChatGenerics } from '../../../../types/types';

type AudioRecorderPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessageInputContextValue<StreamChatGenerics>, 'asyncMessagesMultiSendEnabled'> & {
  /**
   * Function to stop and delete the voice recording.
   */
  deleteVoiceRecording: () => Promise<void>;
  /**
   * Boolean used to show if the voice recording state is locked. This makes sure the mic button shouldn't be pressed any longer.
   * When the mic is locked the `AudioRecordingInProgress` component shows up.
   */
  micLocked: boolean;
  /**
   * The current voice recording that is in progress.
   */
  recording: AudioRecordingReturnType;
  /**
   * Boolean to determine if the recording has been stopped.
   */
  recordingStopped: boolean;
  /**
   * Function to stop the ongoing voice recording.
   */
  stopVoiceRecording: () => Promise<void>;
  /**
   * Function to upload the voice recording.
   */
  uploadVoiceRecording: (multiSendEnabled: boolean) => Promise<void>;
  /**
   * The duration of the voice recording.
   */
  recordingDuration?: number;
  /**
   * Style used in slide to cancel container.
   */
  slideToCancelStyle?: StyleProp<ViewStyle>;
};

const StopRecording = ({
  stopVoiceRecordingHandler,
}: {
  stopVoiceRecordingHandler: () => Promise<void>;
}) => {
  const {
    theme: {
      colors: { accent_red },
      messageInput: {
        audioRecorder: { circleStopIcon, pausedContainer },
      },
    },
  } = useTheme();
  return (
    <Pressable
      onPress={stopVoiceRecordingHandler}
      style={[styles.pausedContainer, pausedContainer]}
    >
      <CircleStop fill={accent_red} size={32} {...circleStopIcon} />
    </Pressable>
  );
};

const UploadRecording = ({
  asyncMessagesMultiSendEnabled,
  uploadVoiceRecordingHandler,
}: {
  asyncMessagesMultiSendEnabled: boolean;
  uploadVoiceRecordingHandler: (multiSendEnabled: boolean) => Promise<void>;
}) => {
  const {
    theme: {
      colors: { accent_blue },
      messageInput: {
        audioRecorder: { checkContainer, sendCheckIcon },
      },
    },
  } = useTheme();
  return (
    <Pressable
      onPress={async () => {
        await uploadVoiceRecordingHandler(asyncMessagesMultiSendEnabled);
      }}
      style={[styles.checkContainer, checkContainer]}
    >
      <SendCheck fill={accent_blue} size={32} {...sendCheckIcon} />
    </Pressable>
  );
};

const DeleteRecording = ({
  deleteVoiceRecordingHandler,
}: {
  deleteVoiceRecordingHandler: () => Promise<void>;
}) => {
  const {
    theme: {
      colors: { accent_blue },
      messageInput: {
        audioRecorder: { deleteContainer, deleteIcon },
      },
    },
  } = useTheme();
  return (
    <Pressable
      onPress={deleteVoiceRecordingHandler}
      style={[styles.deleteContainer, deleteContainer]}
      testID='delete-button'
    >
      <Delete fill={accent_blue} size={32} {...deleteIcon} />
    </Pressable>
  );
};

const AudioRecorderWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: AudioRecorderPropsWithContext<StreamChatGenerics>,
) => {
  const {
    asyncMessagesMultiSendEnabled,
    deleteVoiceRecording,
    micLocked,
    recordingDuration,
    recordingStopped,
    slideToCancelStyle,
    stopVoiceRecording,
    uploadVoiceRecording,
  } = props;

  const {
    theme: {
      colors: { accent_red, grey_dark },
      messageInput: {
        audioRecorder: { arrowLeftIcon, micContainer, micIcon, slideToCancelContainer },
      },
    },
  } = useTheme();

  if (micLocked) {
    if (recordingStopped) {
      return (
        <>
          <DeleteRecording deleteVoiceRecordingHandler={deleteVoiceRecording} />
          <UploadRecording
            asyncMessagesMultiSendEnabled={asyncMessagesMultiSendEnabled}
            uploadVoiceRecordingHandler={uploadVoiceRecording}
          />
        </>
      );
    } else {
      return (
        <>
          <View style={[styles.micContainer, micContainer]}>
            <Mic fill={recordingDuration !== 0 ? accent_red : grey_dark} size={32} {...micIcon} />
          </View>
          <StopRecording stopVoiceRecordingHandler={stopVoiceRecording} />
          <UploadRecording
            asyncMessagesMultiSendEnabled={asyncMessagesMultiSendEnabled}
            uploadVoiceRecordingHandler={uploadVoiceRecording}
          />
        </>
      );
    }
  } else {
    return (
      <>
        <View style={[styles.micContainer, micContainer]} testID='recording-active-container'>
          <Mic fill={recordingDuration !== 0 ? accent_red : grey_dark} size={32} {...micIcon} />
          <Text style={[styles.durationLabel, { color: grey_dark }]}>
            {recordingDuration ? dayjs.duration(recordingDuration).format('mm:ss') : null}
          </Text>
        </View>
        <Animated.View
          style={[styles.slideToCancelContainer, slideToCancelStyle, slideToCancelContainer]}
        >
          <Text style={[styles.slideToCancel, { color: grey_dark }]}>Slide to Cancel</Text>
          <ArrowLeft fill={grey_dark} size={24} {...arrowLeftIcon} />
        </Animated.View>
      </>
    );
  }
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: AudioRecorderPropsWithContext<StreamChatGenerics>,
  nextProps: AudioRecorderPropsWithContext<StreamChatGenerics>,
) => {
  const {
    asyncMessagesMultiSendEnabled: prevAsyncMessagesMultiSendEnabled,
    micLocked: prevMicLocked,
    recording: prevRecording,
    recordingDuration: prevRecordingDuration,
    recordingStopped: prevRecordingStopped,
  } = prevProps;
  const {
    asyncMessagesMultiSendEnabled: nextAsyncMessagesMultiSendEnabled,
    micLocked: nextMicLocked,
    recording: nextRecording,
    recordingDuration: nextRecordingDuration,
    recordingStopped: nextRecordingStopped,
  } = nextProps;

  const asyncMessagesMultiSendEnabledEqual =
    prevAsyncMessagesMultiSendEnabled === nextAsyncMessagesMultiSendEnabled;
  if (!asyncMessagesMultiSendEnabledEqual) return false;

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
> = Partial<AudioRecorderPropsWithContext<StreamChatGenerics>> &
  Pick<
    AudioRecorderPropsWithContext<StreamChatGenerics>,
    | 'deleteVoiceRecording'
    | 'micLocked'
    | 'recording'
    | 'recordingStopped'
    | 'stopVoiceRecording'
    | 'uploadVoiceRecording'
  >;

/**
 * Component to display the Recording UI in the Message Input.
 */
export const AudioRecorder = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: AudioRecorderProps<StreamChatGenerics>,
) => {
  const { asyncMessagesMultiSendEnabled } = useMessageInputContext<StreamChatGenerics>();

  return (
    <MemoizedAudioRecorder
      {...{
        asyncMessagesMultiSendEnabled,
      }}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  checkContainer: {},
  deleteContainer: {},
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
