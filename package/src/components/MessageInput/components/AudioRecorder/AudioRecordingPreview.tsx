import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import dayjs from 'dayjs';

import { useMessageInputContext } from '../../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useAudioPlayer } from '../../../../hooks/useAudioPlayer';
import { useStateStore } from '../../../../hooks/useStateStore';

import { NewPause } from '../../../../icons/NewPause';
import { NewPlay } from '../../../../icons/NewPlay';
import { NativeHandlers } from '../../../../native';
import { AudioPlayerState } from '../../../../state-store/audio-player';
import { AudioRecorderManagerState } from '../../../../state-store/audio-recorder-manager';
import { WaveProgressBar } from '../../../ProgressControl/WaveProgressBar';

const ONE_SECOND_IN_MILLISECONDS = 1000;
const ONE_HOUR_IN_MILLISECONDS = 3600 * 1000;

const audioPlayerSelector = (state: AudioPlayerState) => ({
  duration: state.duration,
  isPlaying: state.isPlaying,
  position: state.position,
  progress: state.progress,
});

const audioRecorderSelector = (state: AudioRecorderManagerState) => ({
  duration: state.duration,
  waveformData: state.waveformData,
  recording: state.recording,
});

/**
 * Component displayed when the audio is recorded and can be previewed.
 */
export const AudioRecordingPreview = () => {
  const { audioRecorderManager } = useMessageInputContext();
  const styles = useStyles();

  const {
    duration: recordingDuration,
    waveformData,
    recording,
  } = useStateStore(audioRecorderManager.state, audioRecorderSelector);

  const uri =
    typeof recording !== 'string' ? (recording?.getURI() as string) : (recording as string);

  const audioPlayer = useAudioPlayer({
    duration: recordingDuration / ONE_SECOND_IN_MILLISECONDS,
    mimeType: 'audio/aac',
    // This is a temporary flag to manage audio player for voice recording in preview as the one in message list uses react-native-video.
    previewVoiceRecording: !(NativeHandlers.SDK === 'stream-chat-expo'),
    type: 'voiceRecording',
    uri,
  });

  const { duration, isPlaying, position, progress } = useStateStore(
    audioPlayer.state,
    audioPlayerSelector,
  );

  // When a audio attachment in preview is removed, we need to remove the player from the pool
  useEffect(
    () => () => {
      audioPlayer.onRemove();
    },
    [audioPlayer],
  );

  const {
    theme: {
      colors: { accent, text },
      messageInput: {
        audioRecordingPreview: {
          container,
          currentTime,
          infoContainer,
          pauseIcon,
          playIcon,
          progressBar,
        },
      },
    },
  } = useTheme();

  const handlePlayPause = () => {
    audioPlayer.toggle();
  };

  const progressDuration = useMemo(
    () =>
      position
        ? position / ONE_HOUR_IN_MILLISECONDS >= 1
          ? dayjs.duration(position, 'milliseconds').format('HH:mm:ss')
          : dayjs.duration(position, 'milliseconds').format('mm:ss')
        : dayjs.duration(duration, 'milliseconds').format('mm:ss'),
    [duration, position],
  );

  return (
    <View style={[styles.container, container]}>
      <View style={[styles.infoContainer, infoContainer]}>
        <Pressable onPress={handlePlayPause} hitSlop={15}>
          {!isPlaying ? (
            <NewPlay fill={text.primary} height={20} width={20} {...playIcon} />
          ) : (
            <NewPause fill={text.primary} height={20} width={20} {...pauseIcon} />
          )}
        </Pressable>
        {/* `durationMillis` is for Expo apps, `currentPosition` is for Native CLI apps. */}
        <Text
          style={[
            styles.durationText,
            currentTime,
            { color: isPlaying ? accent.primary : text.primary },
          ]}
        >
          {progressDuration}
        </Text>
      </View>
      <View style={[styles.progressBar, progressBar]}>
        {/* Since the progress is in range 0-1 we convert it in terms of 100% */}
        <WaveProgressBar amplitudesCount={60} progress={progress} waveformData={waveformData} />
      </View>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { spacing, typography },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: spacing.sm,
          paddingLeft: spacing.sm,
          paddingRight: spacing.md,
        },
        durationText: {
          fontSize: typography.fontSize.md,
          fontWeight: typography.fontWeight.semibold,
          lineHeight: typography.lineHeight.normal,
        },
        infoContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        progressBar: {},
      }),
    [spacing, typography],
  );
};

AudioRecordingPreview.displayName = 'AudioRecordingPreview{messageInput}';
