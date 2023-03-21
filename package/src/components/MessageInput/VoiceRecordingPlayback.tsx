import React, { useEffect, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

import dayjs from 'dayjs';

import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Pause, Play } from '../../icons';
import { Audio, PlaybackStatus, Sound, SoundReturnType } from '../../native';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { ProgressControl } from '../ProgressControl/ProgressControl';

type VoiceRecodingPlaybackPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessageInputContextValue<StreamChatGenerics>, 'recording' | 'recordingStatus'>;

const VoiceRecodingPlaybackWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: VoiceRecodingPlaybackPropsWithContext<StreamChatGenerics>,
) => {
  const [progress, setProgress] = useState<number>(0);
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [paused, setPaused] = useState<boolean>(true);
  const { width } = Dimensions.get('screen');
  const { recording, recordingStatus } = props;

  // For playback support in Expo CLI apps
  const soundRef = React.useRef<SoundReturnType | null>(null);

  useEffect(
    () => () => {
      if (soundRef.current?.stopAsync && soundRef.current.unloadAsync) {
        soundRef.current.stopAsync();
        soundRef.current.unloadAsync();
      }
    },
    [],
  );

  useEffect(() => {
    if (recordingStatus) {
      setDuration(recordingStatus?.currentPosition);
    }
  }, [recordingStatus?.currentPosition]);

  const onProgressHandler = (currentPosition: number, playbackDuration: number) => {
    const currentProgress = currentPosition / playbackDuration;
    if (currentProgress === 1) {
      setPaused(true);
      setProgress(0);
    } else {
      setProgress(currentProgress);
    }
  };

  const onPlaybackStatusUpdate = (status: PlaybackStatus) => {
    setPosition(status?.currentPosition || status?.positionMillis);
    setDuration(status.duration || status.durationMillis);
    // For Native CLI
    if (status.currentPosition && status.duration)
      onProgressHandler(status.currentPosition, status.duration);
    // For Expo CLI
    else if (status.positionMillis && status.durationMillis)
      onProgressHandler(status.positionMillis, status.durationMillis);
  };

  const onPlayPause = async () => {
    if (paused) {
      if (progress === 0) await startPlayer();
      else {
        // For Native CLI
        if (Audio.resumePlayer) await Audio.resumePlayer();
        // For Expo CLI
        if (soundRef.current?.playAsync) await soundRef.current.playAsync();
      }
    } else {
      // For Native CLI
      if (Audio.pausePlayer) await Audio.pausePlayer();
      // For Expo CLI
      if (soundRef.current?.pauseAsync) await soundRef.current.pauseAsync();
    }
    setPaused(!paused);
  };

  const startPlayer = async () => {
    // For Native CLI
    if (Audio.startPlayer) await Audio.startPlayer(undefined, {}, onPlaybackStatusUpdate);
    // For Expo CLI
    if (recording && typeof recording !== 'string') {
      const uri = recording.getURI();
      if (uri) {
        soundRef.current = await Sound.initializeSound({ uri }, {}, onPlaybackStatusUpdate);
        if (soundRef.current?.playAsync) await soundRef.current.playAsync();
      }
    }
  };

  const {
    theme: {
      colors: { accent_blue, grey_dark },
    },
  } = useTheme();

  return (
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
      <View style={styles.progressBar}>
        <ProgressControl
          duration={duration}
          filledColor={accent_blue}
          progress={progress}
          testID='audio-recording-progress-control'
          width={width / 1.5}
        />
      </View>
    </View>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: VoiceRecodingPlaybackPropsWithContext<StreamChatGenerics>,
  nextProps: VoiceRecodingPlaybackPropsWithContext<StreamChatGenerics>,
) => {
  const { recording: prevRecording, recordingStatus: prevRecordingStatus } = prevProps;
  const { recording: nextRecording, recordingStatus: nextRecordingStatus } = nextProps;

  const recordingEqual = prevRecording === nextRecording;
  if (!recordingEqual) return false;

  const recordingStatusEqual =
    prevRecordingStatus?.currentPosition === nextRecordingStatus?.currentPosition &&
    prevRecordingStatus?.durationMillis === nextRecordingStatus?.durationMillis;

  if (!recordingStatusEqual) return false;

  return true;
};

const MemoizedVoiceRecordingPlaybackButton = React.memo(
  VoiceRecodingPlaybackWithContext,
  areEqual,
) as typeof VoiceRecodingPlaybackWithContext;

export type VoiceRecodingPlaybackProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<VoiceRecodingPlaybackPropsWithContext<StreamChatGenerics>>;

/**
 * UI Component for attach button in MessageInput component.
 */
export const VoiceRecordingPlayback = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: VoiceRecodingPlaybackProps<StreamChatGenerics>,
) => {
  const { recording, recordingStatus } = useMessageInputContext<StreamChatGenerics>();

  return <MemoizedVoiceRecordingPlaybackButton {...{ recording, recordingStatus }} {...props} />;
};

const styles = StyleSheet.create({
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
  progressBar: {
    flex: 3,
  },
});

VoiceRecordingPlayback.displayName = 'RecodingPlayback{messageInput}';
