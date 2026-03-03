import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import dayjs from 'dayjs';

import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useStateStore } from '../../../../hooks/useStateStore';
import { Mic } from '../../../../icons/Mic';
import { AudioRecorderManagerState } from '../../../../state-store/audio-recorder-manager';
import { primitives } from '../../../../theme';

type AudioRecordingInProgressPropsWithContext = Pick<
  MessageInputContextValue,
  'audioRecorderManager' | 'AudioRecordingWaveform'
> &
  Pick<AudioRecorderManagerState, 'duration' | 'waveformData'> & {
    /**
     * Maximum number of waveform lines that should be rendered in the UI.
     */
    maxDataPointsDrawn?: number;
  };

const AudioRecordingInProgressWithContext = (props: AudioRecordingInProgressPropsWithContext) => {
  const { AudioRecordingWaveform, maxDataPointsDrawn = 60, duration, waveformData } = props;

  const styles = useStyles();

  const {
    theme: {
      semantics,
      messageInput: {
        audioRecordingInProgress: { container, durationText },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, container]}>
      {/* `durationMillis` is for Expo apps, `currentPosition` is for Native CLI apps. */}
      <View style={styles.micContainer}>
        <Mic height={20} width={20} stroke={semantics.accentError} />
        <Text style={[styles.durationText, durationText]}>
          {duration ? dayjs.duration(duration).format('mm:ss') : null}
        </Text>
      </View>

      {/* TODO: Calculate the maxDataPointsDrawn based on the width of the container */}
      <AudioRecordingWaveform maxDataPointsDrawn={maxDataPointsDrawn} waveformData={waveformData} />
    </View>
  );
};

const MemoizedAudioRecordingInProgress = React.memo(
  AudioRecordingInProgressWithContext,
) as typeof AudioRecordingInProgressWithContext;

export type AudioRecordingInProgressProps = Partial<AudioRecordingInProgressPropsWithContext>;

const audioRecorderSelector = (state: AudioRecorderManagerState) => ({
  duration: state.duration,
  waveformData: state.waveformData,
});

/**
 * Component displayed when the audio is in the recording state.
 */
export const AudioRecordingInProgress = (props: AudioRecordingInProgressProps) => {
  const { audioRecorderManager, AudioRecordingWaveform } = useMessageInputContext();

  const { duration, waveformData } = useStateStore(
    audioRecorderManager.state,
    audioRecorderSelector,
  );

  return (
    <MemoizedAudioRecordingInProgress
      {...{ audioRecorderManager, AudioRecordingWaveform, duration, waveformData }}
      {...props}
    />
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: primitives.spacingSm,
          paddingLeft: primitives.spacingSm,
          paddingRight: primitives.spacingMd,
        },
        durationText: {
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightSemiBold,
          lineHeight: primitives.typographyLineHeightNormal,
          color: semantics.textPrimary,
        },
        micContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: primitives.spacingSm,
        },
      }),
    [semantics.textPrimary],
  );
};

AudioRecordingInProgress.displayName = 'AudioRecordingInProgress{messageInput}';
