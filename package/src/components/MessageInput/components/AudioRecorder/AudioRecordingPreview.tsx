import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import dayjs from 'dayjs';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { Pause, Play } from '../../../../icons';

import { WaveProgressBar } from '../../../ProgressControl/WaveProgressBar';

export type AudioRecordingPreviewProps = {
  paused: boolean;
  position: number;
  progress: number;
  waveformData: number[];
  onVoicePlayerPlayPause?: () => Promise<void>;
};

export const AudioRecordingPreview = (props: AudioRecordingPreviewProps) => {
  const { onVoicePlayerPlayPause, paused, position, progress, waveformData } = props;

  const {
    theme: {
      colors: { accent_blue, grey_dark },
    },
  } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Pressable onPress={onVoicePlayerPlayPause}>
          {paused ? (
            <Play fill={accent_blue} height={32} width={32} />
          ) : (
            <Pause fill={accent_blue} height={32} width={32} />
          )}
        </Pressable>
        {/* `durationMillis` is for Expo apps, `currentPosition` is for Native CLI apps. */}
        <Text style={[styles.currentTime, { color: grey_dark }]}>
          {dayjs.duration(position).format('mm:ss')}
        </Text>
      </View>
      <View style={styles.progressBar}>
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
  info: {
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
