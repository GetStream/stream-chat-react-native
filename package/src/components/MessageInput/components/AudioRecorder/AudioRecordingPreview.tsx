import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import dayjs from 'dayjs';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { Pause, Play } from '../../../../icons';

import { WaveProgressBar } from '../../../ProgressControl/WaveProgressBar';

export type AudioRecordingPreviewProps = {
  /**
   * Boolean used to show the paused state of the player.
   */
  paused: boolean;
  /**
   * Number used to show the current position of the audio being played.
   */
  position: number;
  /**
   * Number used to show the percentage of progress of the audio being played. It should be in 0-1 range.
   */
  progress: number;
  /**
   * The waveform data to be presented to show the audio levels.
   */
  waveformData: number[];
  /**
   * Function to play or pause the audio player.
   */
  onVoicePlayerPlayPause?: () => Promise<void>;
};

/**
 * Component displayed when the audio is recorded and can be previewed.
 */
export const AudioRecordingPreview = (props: AudioRecordingPreviewProps) => {
  const { onVoicePlayerPlayPause, paused, position, progress, waveformData } = props;

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

  return (
    <View style={[styles.container, container]}>
      <View style={[styles.infoContainer, infoContainer]}>
        <Pressable onPress={onVoicePlayerPlayPause}>
          {paused ? (
            <Play fill={accent_blue} height={32} width={32} {...playIcon} />
          ) : (
            <Pause fill={accent_blue} height={32} width={32} {...pauseIcon} />
          )}
        </Pressable>
        {/* `durationMillis` is for Expo apps, `currentPosition` is for Native CLI apps. */}
        <Text style={[styles.currentTime, { color: grey_dark }, currentTime]}>
          {dayjs.duration(position).format('mm:ss')}
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
