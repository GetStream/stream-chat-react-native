import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import dayjs from 'dayjs';

import { useMessageInputContext } from '../../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useStableCallback } from '../../../../hooks';
import { useAudioPlayer } from '../../../../hooks/useAudioPlayer';
import { useStateStore } from '../../../../hooks/useStateStore';

import { Pause } from '../../../../icons/Pause';
import { Play } from '../../../../icons/Play';
import { NativeHandlers } from '../../../../native';
import { AudioPlayerState } from '../../../../state-store/audio-player';
import { AudioRecorderManagerState } from '../../../../state-store/audio-recorder-manager';
import { primitives } from '../../../../theme';
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
      semantics,
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

  const dragStart = useStableCallback(() => {
    audioPlayer.pause();
  });

  const dragEnd = useStableCallback(async (currentProgress: number) => {
    const positionInSeconds = (currentProgress * duration) / ONE_SECOND_IN_MILLISECONDS;
    await audioPlayer.seek(positionInSeconds);
    audioPlayer.play();
  });

  return (
    <View style={[styles.container, container]}>
      <View style={[styles.infoContainer, infoContainer]}>
        <Pressable onPress={handlePlayPause} hitSlop={15}>
          {!isPlaying ? (
            <Play fill={semantics.textPrimary} height={20} width={20} {...playIcon} />
          ) : (
            <Pause fill={semantics.textPrimary} height={20} width={20} {...pauseIcon} />
          )}
        </Pressable>
        {/* `durationMillis` is for Expo apps, `currentPosition` is for Native CLI apps. */}
        <Text
          style={[
            styles.durationText,
            currentTime,
            { color: isPlaying ? semantics.accentPrimary : semantics.textPrimary },
          ]}
        >
          {progressDuration}
        </Text>
      </View>
      <View style={[styles.progressBar, progressBar]}>
        {/* Since the progress is in range 0-1 we convert it in terms of 100% */}
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

AudioRecordingPreview.displayName = 'AudioRecordingPreview{messageInput}';
