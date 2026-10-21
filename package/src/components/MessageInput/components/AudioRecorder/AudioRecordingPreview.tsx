import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import dayjs from 'dayjs';

import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import { useMessageInputContext } from '../../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useStableCallback } from '../../../../hooks';
import { useAudioPlayer } from '../../../../hooks/useAudioPlayer';
import { useStateStore } from '../../../../hooks/useStateStore';

import { AudioPlayerState } from '../../../../state-store/audio-player';
import { AudioRecorderManagerState } from '../../../../state-store/audio-recorder-manager';
import { primitives } from '../../../../theme';
import { StableDurationLabel } from '../../../ProgressControl/StableDurationLabel';
import { WaveProgressBar } from '../../../ProgressControl/WaveProgressBar';

const ONE_SECOND_IN_MILLISECONDS = 1000;
const ONE_HOUR_IN_MILLISECONDS = 3600 * 1000;

const getAudioDurationLabel = (durationInMilliseconds: number) => {
  if (!durationInMilliseconds) {
    return '00:00';
  }

  return durationInMilliseconds / ONE_HOUR_IN_MILLISECONDS >= 1
    ? dayjs.duration(durationInMilliseconds, 'milliseconds').format('HH:mm:ss')
    : dayjs.duration(durationInMilliseconds, 'milliseconds').format('mm:ss');
};

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

/** Displayed after a recording stops, to preview it before sending. */
export const AudioRecordingPreview = () => {
  const { audioRecorderManager } = useMessageInputContext();
  const { icons } = useComponentsContext();
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
    // The preview uses the regular sound player, not the recorder-backed one.
    previewVoiceRecording: false,
    type: 'voiceRecording',
    uri,
  });

  const { duration, isPlaying, position, progress } = useStateStore(
    audioPlayer.state,
    audioPlayerSelector,
  );

  // Removes the player from the pool on unmount.
  useEffect(
    () => () => {
      audioPlayer.onRemove();
    },
    [audioPlayer],
  );

  const {
    theme: {
      semantics,
      messageComposer: {
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

  const maxDurationLabel = useMemo(() => getAudioDurationLabel(duration), [duration]);

  const progressDuration = useMemo(
    () => getAudioDurationLabel(position || duration),
    [duration, position],
  );

  const dragStart = useStableCallback(() => {
    audioPlayer.pause();
  });

  const dragEnd = useStableCallback(async (currentProgress: number) => {
    const positionInSeconds = (currentProgress * duration) / ONE_SECOND_IN_MILLISECONDS;
    await audioPlayer.seek(positionInSeconds);
  });

  return (
    <View style={[styles.container, container]}>
      <View style={[styles.infoContainer, infoContainer]}>
        <Pressable onPress={handlePlayPause} hitSlop={15}>
          {!isPlaying ? (
            <icons.Play fill={semantics.textPrimary} height={20} width={20} {...playIcon} />
          ) : (
            <icons.Pause fill={semantics.textPrimary} height={20} width={20} {...pauseIcon} />
          )}
        </Pressable>
        {/* Elapsed playback time. */}
        <StableDurationLabel
          accessibilityLabel='Progress Duration'
          reserveLabel={maxDurationLabel}
          label={progressDuration}
          style={[styles.durationText, currentTime]}
          visibleStyle={{
            color: isPlaying ? semantics.accentPrimary : semantics.textPrimary,
          }}
        />
      </View>
      <View style={[styles.progressBar, progressBar]}>
        {/* `progress` is a fraction from 0 to 1. */}
        <WaveProgressBar
          isPlaying={isPlaying}
          progress={progress}
          waveformData={waveformData}
          onStartDrag={dragStart}
          onEndDrag={dragEnd}
        />
      </View>
    </View>
  );
};

const useStyles = () => {
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
          gap: primitives.spacingMd,
        },
        durationText: {
          fontVariant: ['tabular-nums'],
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightSemiBold,
          lineHeight: primitives.typographyLineHeightNormal,
        },
        infoContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: primitives.spacingSm,
        },
        progressBar: {
          flex: 1,
        },
      }),
    [],
  );
};

AudioRecordingPreview.displayName = 'AudioRecordingPreview{messageComposer}';
