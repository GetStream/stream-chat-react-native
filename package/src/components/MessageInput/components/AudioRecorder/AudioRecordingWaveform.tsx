import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { AudioRecorderManagerState } from '../../../../state-store/audio-recorder-manager';

export type AudioRecordingWaveformProps = Pick<AudioRecorderManagerState, 'waveformData'> & {
  /**
   * Maximum number of waveform lines that should be rendered in the UI.
   */
  maxDataPointsDrawn: number;
};

const WAVEFORM_MAX_HEIGHT = 20;

/**
 * Waveform Component displayed when the audio is in the recording state.
 */
export const AudioRecordingWaveform = (props: AudioRecordingWaveformProps) => {
  const { maxDataPointsDrawn, waveformData } = props;
  const styles = useStyles();
  const {
    theme: {
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
              height: waveform * WAVEFORM_MAX_HEIGHT,
            },
            waveformTheme,
          ]}
        />
      ))}
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { colors, radius },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignSelf: 'center',
          flexDirection: 'row',
        },
        waveform: {
          alignSelf: 'center',
          borderRadius: radius.xxs,
          marginHorizontal: 1,
          width: 2,
          minHeight: 2,
          maxHeight: WAVEFORM_MAX_HEIGHT,
          backgroundColor: colors.border.opacity25,
        },
      }),
    [radius, colors],
  );
};

AudioRecordingWaveform.displayName = 'AudioRecordingWaveform{messageInput}';
