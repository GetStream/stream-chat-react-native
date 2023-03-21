import React from 'react';
import { GestureResponderEvent, StyleSheet, Text, View } from 'react-native';

import dayjs from 'dayjs';

import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

type VoiceRecordingPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessageInputContextValue<StreamChatGenerics>, 'recordingStatus'> & {
  /** Function that opens audio selector */
  handleOnPress?: ((event: GestureResponderEvent) => void) & (() => void);
};

const VoiceRecordingWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: VoiceRecordingPropsWithContext<StreamChatGenerics>,
) => {
  const { recordingStatus } = props;
  const duration = recordingStatus?.currentPosition || recordingStatus?.durationMillis;

  const {
    theme: {
      colors: { grey_dark },
    },
  } = useTheme();

  return (
    <View style={styles.recordingDetails}>
      <Text style={{ color: grey_dark, fontSize: 15 }}>Recording</Text>
      {/* `durationMillis` is for Expo apps, `currentPosition` is for Native CLI apps. */}
      <Text style={{ color: grey_dark, fontSize: 24, marginVertical: 5 }}>
        {duration ? dayjs.duration(duration).format('mm:ss') : null}
      </Text>
    </View>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: VoiceRecordingPropsWithContext<StreamChatGenerics>,
  nextProps: VoiceRecordingPropsWithContext<StreamChatGenerics>,
) => {
  const { recordingStatus: prevRecordingStatus } = prevProps;
  const { recordingStatus: nextRecordingStatus } = nextProps;

  const recordingStatusEqual =
    prevRecordingStatus?.currentPosition === nextRecordingStatus?.currentPosition &&
    prevRecordingStatus?.durationMillis === nextRecordingStatus?.durationMillis;

  if (!recordingStatusEqual) return false;

  return true;
};

const MemoizedVoiceRecording = React.memo(
  VoiceRecordingWithContext,
  areEqual,
) as typeof VoiceRecordingWithContext;

export type VoiceRecordingProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<VoiceRecordingPropsWithContext<StreamChatGenerics>>;

/**
 * UI Component for attach button in MessageInput component.
 */
export const VoiceRecording = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: VoiceRecordingProps<StreamChatGenerics>,
) => {
  const { recordingStatus } = useMessageInputContext<StreamChatGenerics>();

  return <MemoizedVoiceRecording {...{ recordingStatus }} {...props} />;
};

const styles = StyleSheet.create({
  recordingDetails: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
  },
});

VoiceRecording.displayName = 'VoiceRecording{messageInput}';
