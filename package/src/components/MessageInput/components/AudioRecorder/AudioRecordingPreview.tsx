import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import dayjs from 'dayjs';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useAudioPlayerControl } from '../../../../hooks/useAudioPlayerControl';
import { useStateStore } from '../../../../hooks/useStateStore';
import { Pause, Play } from '../../../../icons';

import { NativeHandlers } from '../../../../native';
import { AudioPlayerState } from '../../../../state-store/audio-player';
import { WaveProgressBar } from '../../../ProgressControl/WaveProgressBar';

const ONE_SECOND_IN_MILLISECONDS = 1000;
const ONE_HOUR_IN_MILLISECONDS = 3600 * 1000;

export type AudioRecordingPreviewProps = {
  recordingDuration: number;
  uri: string;
  /**
   * The waveform data to be presented to show the audio levels.
   */
  waveformData: number[];
};

const audioPlayerSelector = (state: AudioPlayerState) => ({
  duration: state.duration,
  isPlaying: state.isPlaying,
  position: state.position,
  progress: state.progress,
});

/**
 * Component displayed when the audio is recorded and can be previewed.
 */
export const AudioRecordingPreview = (props: AudioRecordingPreviewProps) => {
  const { recordingDuration, uri, waveformData } = props;

  const { audioPlayer, toggleAudio } = useAudioPlayerControl({
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
      colors: { accent_blue, grey_dark },
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
    toggleAudio(audioPlayer.id);
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
        <Pressable onPress={handlePlayPause}>
          {!isPlaying ? (
            <Play fill={accent_blue} height={32} width={32} {...playIcon} />
          ) : (
            <Pause fill={accent_blue} height={32} width={32} {...pauseIcon} />
          )}
        </Pressable>
        {/* `durationMillis` is for Expo apps, `currentPosition` is for Native CLI apps. */}
        <Text style={[styles.currentTime, { color: grey_dark }, currentTime]}>
          {progressDuration}
        </Text>
      </View>
      <View style={[styles.progressBar, progressBar]}>
        {/* Since the progress is in range 0-1 we convert it in terms of 100% */}
        <WaveProgressBar progress={progress} waveformData={waveformData} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    paddingBottom: 8,
    paddingTop: 4,
  },
  currentTime: {
    fontSize: 16,
    marginLeft: 4,
  },
  infoContainer: {
    alignItems: 'center',
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
  },
  progressBar: {
    flex: 3,
  },
});

AudioRecordingPreview.displayName = 'AudioRecordingPreview{messageInput}';
