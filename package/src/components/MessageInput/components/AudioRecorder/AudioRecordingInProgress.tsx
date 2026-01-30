import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import dayjs from 'dayjs';

import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useStateStore } from '../../../../hooks/useStateStore';
import { NewMic } from '../../../../icons/NewMic';
import { AudioRecorderManagerState } from '../../../../state-store/audio-recorder-manager';

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
      colors: { accent },
      messageInput: {
        audioRecordingInProgress: { container, durationText },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, container]}>
      {/* `durationMillis` is for Expo apps, `currentPosition` is for Native CLI apps. */}
      <View style={styles.micContainer}>
        <NewMic height={20} width={20} stroke={accent.error} />
        <Text style={[styles.durationText, durationText]}>
          {duration ? dayjs.duration(duration).format('mm:ss') : null}
        </Text>
      </View>

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
    theme: { colors, spacing, typography },
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
          color: colors.text.primary,
        },
        micContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
      }),
    [colors, spacing, typography],
  );
};

AudioRecordingInProgress.displayName = 'AudioRecordingInProgress{messageInput}';
