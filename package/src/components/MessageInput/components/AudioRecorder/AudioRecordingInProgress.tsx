import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import dayjs from 'dayjs';

import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useStateStore } from '../../../../hooks/useStateStore';
import { AudioRecorderManagerState } from '../../../../state-store/audio-recorder-manager';
import { primitives } from '../../../../theme';

type AudioRecordingInProgressPropsWithContext = Pick<
  MessageInputContextValue,
  'audioRecorderManager'
> &
  Pick<AudioRecorderManagerState, 'duration' | 'waveformData'> & {
    /** Maximum number of waveform lines rendered. Defaults to 60. */
    maxDataPointsDrawn?: number;
  };

const AudioRecordingInProgressWithContext = (props: AudioRecordingInProgressPropsWithContext) => {
  const { maxDataPointsDrawn = 60, duration, waveformData } = props;
  const { AudioRecordingWaveform, icons } = useComponentsContext();

  const styles = useStyles();

  const {
    theme: {
      semantics,
      messageComposer: {
        audioRecordingInProgress: { container, durationText },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, container]}>
      {/* Mic icon and elapsed recording time. */}
      <View style={styles.micContainer}>
        <icons.Mic height={20} width={20} stroke={semantics.accentError} />
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

/** Displayed while audio is being recorded. */
export const AudioRecordingInProgress = (props: AudioRecordingInProgressProps) => {
  const { audioRecorderManager } = useMessageInputContext();

  const { duration, waveformData } = useStateStore(
    audioRecorderManager.state,
    audioRecorderSelector,
  );

  return (
    <MemoizedAudioRecordingInProgress
      {...{ audioRecorderManager, duration, waveformData }}
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

AudioRecordingInProgress.displayName = 'AudioRecordingInProgress{messageComposer}';
