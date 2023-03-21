import React, { useEffect, useState } from 'react';
import { Dimensions, GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import dayjs from 'dayjs';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../contexts/channelContext/ChannelContext';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Delete } from '../../icons/Delete';
import { Mic } from '../../icons/Mic';
import { Pause } from '../../icons/Pause';
import { Play } from '../../icons/Play';
import { SendPlane } from '../../icons/SendPlane';
import { Stop } from '../../icons/Stop';

import { Audio, PlaybackStatus } from '../../native';
import type { DefaultStreamChatGenerics } from '../../types/types';
import { ProgressControl } from '../ProgressControl/ProgressControl';

type MicInputPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ChannelContextValue<StreamChatGenerics>, 'disabled'> &
  Pick<
    MessageInputContextValue<StreamChatGenerics>,
    'recording' | 'recordingStatus' | 'setRecording' | 'setShowVoiceUI'
  > & {
    /** Function that opens audio selector */
    handleOnPress?: ((event: GestureResponderEvent) => void) & (() => void);
  };

const MicInputWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MicInputPropsWithContext<StreamChatGenerics>,
) => {
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus | undefined>(undefined);
  const [recordingStopped, setRecordingStopped] = useState<boolean>(true);
  const { disabled, handleOnPress, recording, recordingStatus, setRecording, setShowVoiceUI } =
    props;
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [paused, setPaused] = useState<boolean>(true);
  const { width } = Dimensions.get('screen');

  const {
    theme: {
      colors: { accent_blue, accent_red, grey_dark },
      messageInput: { commandsButton },
    },
  } = useTheme();

  const position = playbackStatus ? playbackStatus.currentPosition : 0;

  useEffect(() => {
    if (recordingStatus) {
      setProgress(position / recordingStatus?.currentPosition);
      setDuration(recordingStatus?.currentPosition);
    }
  }, [recordingStatus?.currentPosition]);

  const onPlaybackStatusUpdate = (status: PlaybackStatus) => {
    setPlaybackStatus(status);
    setDuration(status.duration);
    const currentProgress = status.currentPosition / status.duration;
    if (currentProgress === 1) {
      setPaused(true);
      setProgress(0);
    } else {
      setProgress(currentProgress);
    }
  };

  const onPlayPause = async () => {
    if (paused) {
      if (progress === 0) await startPlayer();
      else await Audio.resumePlayer();
    } else {
      await Audio.pausePlayer();
    }
    setPaused(!paused);
  };

  const startPlayer = async () => {
    await Audio.startPlayer(undefined, onPlaybackStatusUpdate);
  };

  const stopRecording = async () => {
    if (recording) {
      // For Expo CLI
      if (typeof recording !== 'string') {
        await recording.stopAndUnloadAsync();
        await Audio.stopRecording();
        const uri = await recording.getURI();
        console.log('Recording URI', uri);
      }
      // For RN CLI
      else {
        await Audio.stopRecording();
      }
    }
    setRecordingStopped(true);
  };

  const deleteRecording = () => {
    setRecording(undefined);
    setRecordingStopped(false);
    setShowVoiceUI(false);
  };

  return (
    <View style={styles.container}>
      {recording ? (
        !recordingStopped ? (
          <View style={styles.recordingDetails}>
            <Text style={{ color: grey_dark, fontSize: 15 }}>Recording</Text>
            {/* `durationMillis` is for Expo apps, `currentPosition` is for Native CLI apps. */}
            <Text style={{ color: grey_dark, fontSize: 24, marginVertical: 5 }}>
              {recordingStatus
                ? dayjs.duration(recordingStatus.durationMillis || duration).format('mm:ss')
                : null}
            </Text>
          </View>
        ) : (
          <View style={styles.playback}>
            <View style={styles.info}>
              <Pressable onPress={onPlayPause}>
                {paused ? (
                  <Play height={22} pathFill={accent_blue} width={22} />
                ) : (
                  <Pause height={22} pathFill={accent_blue} width={22} />
                )}
              </Pressable>
              {/* `durationMillis` is for Expo apps, `currentPosition` is for Native CLI apps. */}
              <Text style={[styles.currentTime, { color: grey_dark }]}>
                {dayjs.duration(position).format('mm:ss')}
              </Text>
            </View>
            <View style={{ flex: 3 }}>
              <ProgressControl
                duration={duration}
                filledColor={accent_blue}
                progress={progress}
                testID='audio-recording-progress-control'
                width={width / 1.5}
              />
            </View>
          </View>
        )
      ) : null}
      <View style={styles.buttons}>
        {recordingStopped ? (
          <Pressable
            disabled={disabled}
            onPress={deleteRecording}
            style={[commandsButton]}
            testID='delete-button'
          >
            <Delete height={28} pathFill={accent_blue} width={28} />
          </Pressable>
        ) : (
          <>
            <Mic height={25} pathFill={accent_red} width={19} />
            <Pressable
              disabled={disabled}
              onPress={stopRecording}
              style={[commandsButton]}
              testID='stop-button'
            >
              <Stop height={28} pathFill={accent_red} viewBox={`0 0 ${28} ${28}`} width={28} />
            </Pressable>
          </>
        )}
        <Pressable
          disabled={disabled}
          onPress={handleOnPress}
          style={[commandsButton]}
          testID='send-audio-button'
        >
          <SendPlane height={28} pathFill={accent_blue} viewBox={`0 0 ${28} ${28}`} width={28} />
        </Pressable>
      </View>
    </View>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: MicInputPropsWithContext<StreamChatGenerics>,
  nextProps: MicInputPropsWithContext<StreamChatGenerics>,
) => {
  const {
    disabled: prevDisabled,
    recording: prevRecording,
    recordingStatus: prevRecordingStatus,
  } = prevProps;
  const {
    disabled: nextDisabled,
    recording: nextRecording,
    recordingStatus: nextRecordingStatus,
  } = nextProps;

  const disabledEqual = prevDisabled === nextDisabled;
  if (!disabledEqual) return false;

  const recordingEqual = prevRecording === nextRecording;
  if (!recordingEqual) return false;

  const recordingStatusEqual =
    prevRecordingStatus?.currentPosition === nextRecordingStatus?.currentPosition &&
    prevRecordingStatus?.durationMillis === nextRecordingStatus?.durationMillis;

  if (!recordingStatusEqual) return false;

  return true;
};

const MemoizedMicInput = React.memo(MicInputWithContext, areEqual) as typeof MicInputWithContext;

export type MicInputProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<MicInputPropsWithContext<StreamChatGenerics>>;

/**
 * UI Component for attach button in MessageInput component.
 */
export const MicInput = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MicInputProps<StreamChatGenerics>,
) => {
  const { disabled = false } = useChannelContext<StreamChatGenerics>();
  const { recording, recordingStatus, setRecording, setShowVoiceUI } =
    useMessageInputContext<StreamChatGenerics>();

  return (
    <MemoizedMicInput
      {...{ disabled, recording, recordingStatus, setRecording, setShowVoiceUI }}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  buttons: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  container: {},
  currentTime: {
    fontSize: 16,
    marginLeft: 15,
  },
  info: {
    alignItems: 'center',
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
  },
  playback: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 10,
  },
  recordingDetails: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
  },
});

MicInput.displayName = 'MicInput{messageInput}';
