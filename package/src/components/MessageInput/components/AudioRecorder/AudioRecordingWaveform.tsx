import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';

export type AudioRecordingWaveformProps = {
  /**
   * Maximum number of waveform lines that should be rendered in the UI.
   */
  maxDataPointsDrawn: number;
  /**
   * The waveform data to be presented to show the audio levels.
   */
  waveformData: number[];
};

/**
 * Waveform Component displayed when the audio is in the recording state.
 */
export const AudioRecordingWaveform = (props: AudioRecordingWaveformProps) => {
  const { maxDataPointsDrawn, waveformData } = props;
  const {
    theme: {
      colors: { grey_dark },
      messageInput: {
        audioRecordingWaveform: { container, waveform: waveformTheme },
      },
    },
  } = useTheme();
  return (
    <View style={[styles.container, container]}>
      {waveformData.slice(-maxDataPointsDrawn).map((waveform, index) => (
        <View
          key={index}
          style={[
            styles.waveform,
            {
              backgroundColor: grey_dark,
              height: waveform * 30 > 3 ? waveform * 30 : 3,
            },
            waveformTheme,
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    flexDirection: 'row',
  },
  waveform: {
    alignSelf: 'center',
    borderRadius: 2,
    marginHorizontal: 1,
    width: 2,
  },
});

AudioRecordingWaveform.displayName = 'AudioRecordingWaveform{messageInput}';
