import React, { RefObject, useEffect, useMemo, useState } from 'react';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

import { AudioAttachment as StreamAudioAttachment } from 'stream-chat';

import { useTheme } from '../../contexts';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { Audio, Pause, Play } from '../../icons';
import {
  NativeHandlers,
  PlaybackStatus,
  SoundReturnType,
  VideoPayloadData,
  VideoProgressData,
  VideoSeekResponse,
} from '../../native';
import { AudioConfig, FileTypes } from '../../types/types';
import { getTrimmedAttachmentTitle } from '../../utils/getTrimmedAttachmentTitle';
import { ProgressControl } from '../ProgressControl/ProgressControl';
import { WaveProgressBar } from '../ProgressControl/WaveProgressBar';

dayjs.extend(duration);

export type AudioAttachmentType = AudioConfig &
  Pick<StreamAudioAttachment, 'waveform_data' | 'asset_url' | 'title'> & {
    id: string;
    type: 'audio' | 'voiceRecording';
  };

export type AudioAttachmentProps = {
  item: AudioAttachmentType;
  onLoad: (index: string, duration: number) => void;
  onPlayPause: (index: string, pausedStatus?: boolean) => void;
  onProgress: (index: string, progress: number) => void;
  titleMaxLength?: number;
  hideProgressBar?: boolean;
  showSpeedSettings?: boolean;
  testID?: string;
};

/**
 * AudioAttachment
 * UI Component to preview the audio files
 */
export const AudioAttachment = (props: AudioAttachmentProps) => {
  const [currentSpeed, setCurrentSpeed] = useState<number>(1.0);
  const [audioFinished, setAudioFinished] = useState(false);
  const soundRef = React.useRef<SoundReturnType | null>(null);
  const {
    hideProgressBar = false,
    item,
    onLoad,
    onPlayPause,
    onProgress,
    showSpeedSettings = false,
    testID,
    titleMaxLength,
  } = props;
  const { changeAudioSpeed, pauseAudio, playAudio, seekAudio } = useAudioPlayer({ soundRef });
  const isExpoCLI = NativeHandlers.SDK === 'stream-chat-expo';
  const isVoiceRecording = item.type === FileTypes.VoiceRecording;

  /** This is for Native CLI Apps */
  const handleLoad = (payload: VideoPayloadData) => {
    // The duration given by the rn-video is not same as the one of the voice recording, so we take the actual duration for voice recording.
    if (isVoiceRecording && item.duration) {
      onLoad(item.id, item.duration);
    } else {
      onLoad(item.id, item.duration || payload.duration);
    }
  };

  /** This is for Native CLI Apps */
  const handleProgress = (data: VideoProgressData) => {
    const { currentTime, seekableDuration } = data;
    // The duration given by the rn-video is not same as the one of the voice recording, so we take the actual duration for voice recording.
    if (isVoiceRecording && item.duration) {
      if (currentTime < item.duration && !audioFinished) {
        onProgress(item.id, currentTime / item.duration);
      } else {
        setAudioFinished(true);
      }
    } else {
      if (currentTime < seekableDuration && !audioFinished) {
        onProgress(item.id, currentTime / seekableDuration);
      } else {
        setAudioFinished(true);
      }
    }
  };

  /** This is for Native CLI Apps */
  const onSeek = (seekResponse: VideoSeekResponse) => {
    setAudioFinished(false);
    onProgress(item.id, seekResponse.currentTime / (item.duration as number));
  };

  const handlePlayPause = async () => {
    if (item.paused) {
      if (isExpoCLI) {
        await playAudio();
      }
      onPlayPause(item.id, false);
    } else {
      if (isExpoCLI) {
        await pauseAudio();
      }
      onPlayPause(item.id, true);
    }
  };

  const handleEnd = async () => {
    setAudioFinished(false);
    await pauseAudio();
    onPlayPause(item.id, true);
    await seekAudio(0);
  };

  const dragStart = async () => {
    if (isExpoCLI) {
      await pauseAudio();
    }
    onPlayPause(item.id, true);
  };

  const dragProgress = (progress: number) => {
    onProgress(item.id, progress);
  };

  const dragEnd = async (progress: number) => {
    await seekAudio(progress * (item.duration as number));
    if (isExpoCLI) {
      await playAudio();
    }
    onPlayPause(item.id, false);
  };

  /** For Expo CLI */
  const onPlaybackStatusUpdate = (playbackStatus: PlaybackStatus) => {
    if (!playbackStatus.isLoaded) {
      // Update your UI for the unloaded state
      if (playbackStatus.error) {
        console.log(`Encountered a fatal error during playback: ${playbackStatus.error}`);
      }
    } else {
      const { durationMillis, positionMillis } = playbackStatus;
      // This is done for Expo CLI where we don't get file duration from file picker
      if (item.duration === 0) {
        onLoad(item.id, durationMillis / 1000);
      } else {
        // The duration given by the expo-av is not same as the one of the voice recording, so we take the actual duration for voice recording.
        if (isVoiceRecording && item.duration) {
          onLoad(item.id, item.duration);
        } else {
          onLoad(item.id, durationMillis / 1000);
        }
      }
      // Update your UI for the loaded state
      if (playbackStatus.isPlaying) {
        if (isVoiceRecording && item.duration) {
          if (positionMillis <= item.duration * 1000) {
            onProgress(item.id, positionMillis / (item.duration * 1000));
          }
        } else {
          if (positionMillis <= durationMillis) {
            onProgress(item.id, positionMillis / durationMillis);
          }
        }
      } else {
        // Update your UI for the paused state
      }

      if (playbackStatus.isBuffering) {
        // Update your UI for the buffering state
      }

      if (playbackStatus.didJustFinish && !playbackStatus.isLooping) {
        onProgress(item.id, 1);
        // The player has just finished playing and will stop. Maybe you want to play something else?
        // status: opposite of pause,says i am playing
        handleEnd();
      }
    }
  };

  // This is for Expo CLI, sound initialization is done here.
  useEffect(() => {
    if (isExpoCLI) {
      const initiateSound = async () => {
        if (item && item.asset_url && NativeHandlers.Sound?.initializeSound) {
          soundRef.current = await NativeHandlers.Sound.initializeSound(
            { uri: item.asset_url },
            {
              pitchCorrectionQuality: 'high',
              progressUpdateIntervalMillis: 100,
              shouldCorrectPitch: true,
            },
            onPlaybackStatusUpdate,
          );
        }
      };
      initiateSound();
    }

    return () => {
      if (soundRef.current?.stopAsync && soundRef.current.unloadAsync) {
        soundRef.current.stopAsync();
        soundRef.current.unloadAsync();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // This is needed for expo applications where the rerender doesn't occur on time thefore you need to update the state of the sound.
  useEffect(() => {
    const initalPlayPause = async () => {
      if (!isExpoCLI) {
        return;
      }
      try {
        if (item.paused) {
          await pauseAudio();
        } else {
          await playAudio();
        }
      } catch (e) {
        console.log('An error has occurred while trying to interact with the audio. ', e);
      }
    };
    // For expo CLI
    if (!NativeHandlers.Sound?.Player) {
      initalPlayPause();
    }
  }, [item.paused, isExpoCLI, pauseAudio, playAudio]);

  const onSpeedChangeHandler = async () => {
    if (currentSpeed === 2.0) {
      setCurrentSpeed(1.0);
      await changeAudioSpeed(1.0);
    } else {
      if (currentSpeed === 1.0) {
        setCurrentSpeed(1.5);
        await changeAudioSpeed(1.5);
      } else if (currentSpeed === 1.5) {
        setCurrentSpeed(2.0);
        await changeAudioSpeed(2.0);
      }
    }
  };

  const {
    theme: {
      audioAttachment: {
        container,
        leftContainer,
        playPauseButton,
        progressControlContainer,
        progressDurationText,
        rightContainer,
        speedChangeButton,
        speedChangeButtonText,
      },
      colors: { accent_blue, black, grey_dark, grey_whisper, static_black, static_white, white },
      messageInput: {
        fileAttachmentUploadPreview: { filenameText },
      },
    },
  } = useTheme();

  const progressValueInSeconds = useMemo(
    () => (item.duration as number) * (item.progress as number),
    [item.duration, item.progress],
  );

  const progressDuration = useMemo(
    () =>
      progressValueInSeconds
        ? progressValueInSeconds / 3600 >= 1
          ? dayjs.duration(progressValueInSeconds, 'second').format('HH:mm:ss')
          : dayjs.duration(progressValueInSeconds, 'second').format('mm:ss')
        : dayjs.duration(item.duration ?? 0, 'second').format('mm:ss'),
    [progressValueInSeconds, item.duration],
  );

  return (
    <View
      accessibilityLabel='audio-attachment-preview'
      style={[
        styles.container,
        {
          backgroundColor: white,
          borderColor: grey_whisper,
        },
        container,
      ]}
      testID={testID}
    >
      <View style={[styles.leftContainer, leftContainer]}>
        <Pressable
          accessibilityLabel='Play Pause Button'
          onPress={handlePlayPause}
          style={[
            styles.playPauseButton,
            { backgroundColor: static_white, shadowColor: black },
            playPauseButton,
          ]}
        >
          {item.paused ? (
            <Play fill={static_black} height={32} width={32} />
          ) : (
            <Pause fill={static_black} height={32} width={32} />
          )}
        </Pressable>
      </View>
      <View style={[styles.centerContainer]}>
        <Text
          accessibilityLabel='File Name'
          numberOfLines={1}
          style={[
            styles.filenameText,
            {
              color: black,
            },
            I18nManager.isRTL ? { writingDirection: 'rtl' } : { writingDirection: 'ltr' },
            filenameText,
          ]}
        >
          {item.type === FileTypes.VoiceRecording
            ? 'Recording'
            : getTrimmedAttachmentTitle(item.title, titleMaxLength)}
        </Text>
        <View style={styles.audioInfo}>
          <Text style={[styles.progressDurationText, { color: grey_dark }, progressDurationText]}>
            {progressDuration}
          </Text>
          {!hideProgressBar && (
            <View style={[styles.progressControlContainer, progressControlContainer]}>
              {item.waveform_data ? (
                <WaveProgressBar
                  amplitudesCount={30}
                  onEndDrag={dragEnd}
                  onProgressDrag={dragProgress}
                  onStartDrag={dragStart}
                  progress={item.progress as number}
                  waveformData={item.waveform_data}
                />
              ) : (
                <ProgressControl
                  duration={item.duration as number}
                  filledColor={accent_blue}
                  onEndDrag={dragEnd}
                  onProgressDrag={dragProgress}
                  onStartDrag={dragStart}
                  progress={item.progress as number}
                  testID='progress-control'
                />
              )}
            </View>
          )}
        </View>
        {NativeHandlers.Sound?.Player && (
          <NativeHandlers.Sound.Player
            onEnd={handleEnd}
            onLoad={handleLoad}
            onProgress={handleProgress}
            onSeek={onSeek}
            paused={item.paused}
            rate={currentSpeed}
            soundRef={soundRef as RefObject<SoundReturnType>}
            testID='sound-player'
            uri={item.asset_url}
          />
        )}
      </View>
      {showSpeedSettings ? (
        <View style={[styles.rightContainer, rightContainer]}>
          {item.paused ? (
            <Audio fill={'#ffffff'} />
          ) : (
            <Pressable
              onPress={onSpeedChangeHandler}
              style={[
                styles.speedChangeButton,
                { backgroundColor: static_white, shadowColor: black },
                speedChangeButton,
              ]}
            >
              <Text
                style={[styles.speedChangeButtonText, speedChangeButtonText]}
              >{`x${currentSpeed.toFixed(1)}`}</Text>
            </Pressable>
          )}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  audioInfo: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  centerContainer: {
    flexGrow: 1,
  },
  container: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    paddingLeft: 8,
    paddingRight: 16,
    paddingVertical: 12,
  },
  filenameText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  leftContainer: {
    marginRight: 8,
  },
  playPauseButton: {
    alignItems: 'center',
    borderRadius: 50,
    elevation: 4,
    justifyContent: 'center',
    marginRight: 8,
    padding: 4,
    shadowOffset: {
      height: 2,
      width: 0,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  progressControlContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  progressDurationText: {
    fontSize: 12,
    marginRight: 8,
  },
  rightContainer: {
    marginLeft: 16,
  },
  speedChangeButton: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 50,
    elevation: 4,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowOffset: {
      height: 2,
      width: 0,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  speedChangeButtonText: {
    fontSize: 12,
  },
});

AudioAttachment.displayName = 'AudioAttachment{messageInput{audioAttachment}}';
