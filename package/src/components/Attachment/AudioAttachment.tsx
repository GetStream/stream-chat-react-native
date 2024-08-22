import React, { useEffect, useState } from 'react';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

import { useTheme } from '../../contexts';
import { Audio, Pause, Play } from '../../icons';
import {
  PlaybackStatus,
  Sound,
  SoundReturnType,
  VideoPayloadData,
  VideoProgressData,
} from '../../native';
import type { FileUpload } from '../../types/types';
import { getTrimmedAttachmentTitle } from '../../utils/getTrimmedAttachmentTitle';
import { ProgressControl } from '../ProgressControl/ProgressControl';
import { WaveProgressBar } from '../ProgressControl/WaveProgressBar';

dayjs.extend(duration);

export type AudioAttachmentProps = {
  item: Omit<FileUpload, 'state'>;
  onLoad: (index: string, duration: number) => void;
  onPlayPause: (index: string, pausedStatus?: boolean) => void;
  onProgress: (index: string, currentTime?: number, hasEnd?: boolean) => void;
  hideProgressBar?: boolean;
  showSpeedSettings?: boolean;
  testID?: string;
};

/**
 * AudioAttachment
 * UI Component to preview the audio files
 */
export const AudioAttachment = (props: AudioAttachmentProps) => {
  const [width, setWidth] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState<number>(1.0);
  const soundRef = React.useRef<SoundReturnType | null>(null);
  const {
    hideProgressBar = false,
    item,
    onLoad,
    onPlayPause,
    onProgress,
    showSpeedSettings = false,
    testID,
  } = props;

  /** This is for Native CLI Apps */
  const handleLoad = (payload: VideoPayloadData) => {
    onLoad(item.id, item.duration || payload.duration);
  };

  /** This is for Native CLI Apps */
  const handleProgress = (data: VideoProgressData) => {
    if (data.currentTime <= data.seekableDuration) {
      onProgress(item.id, data.currentTime);
    }
  };

  /** This is for Native CLI Apps */
  const handleEnd = () => {
    onPlayPause(item.id, true);
    onProgress(item.id, item.duration, true);
  };

  const handlePlayPause = async (isPausedStatusAvailable?: boolean) => {
    if (soundRef.current) {
      if (isPausedStatusAvailable === undefined) {
        if (item.progress === 1) {
          // For native CLI
          if (soundRef.current.seek) soundRef.current.seek(0);
          // For expo CLI
          if (soundRef.current.setPositionAsync) soundRef.current.setPositionAsync(0);
        }
        if (item.paused) {
          // For expo CLI
          if (soundRef.current.playAsync) await soundRef.current.playAsync();
          if (soundRef.current.setProgressUpdateIntervalAsync)
            await soundRef.current.setProgressUpdateIntervalAsync(60);
          onPlayPause(item.id, false);
        } else {
          // For expo CLI
          if (soundRef.current.pauseAsync) await soundRef.current.pauseAsync();
          onPlayPause(item.id, true);
        }
      } else {
        onPlayPause(item.id, isPausedStatusAvailable);
      }
    }
  };

  const handleProgressDrag = async (position: number) => {
    onProgress(item.id, position);
    // For native CLI
    if (soundRef.current?.seek) soundRef.current.seek(position);
    // For expo CLI
    if (soundRef.current?.setPositionAsync) {
      await soundRef.current.setPositionAsync(position * 1000);
    }
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
      }
      // Update your UI for the loaded state
      if (playbackStatus.isPlaying) {
        // Update your UI for the playing state
        onProgress(item.id, positionMillis / 1000);
      } else {
        // Update your UI for the paused state
      }

      if (playbackStatus.isBuffering) {
        // Update your UI for the buffering state
      }

      if (playbackStatus.didJustFinish && !playbackStatus.isLooping) {
        // The player has just finished playing and will stop. Maybe you want to play something else?
        // status: opposite of pause,says i am playing
        handleEnd();
      }
    }
  };

  useEffect(() => {
    if (Sound.Player === null) {
      const initiateSound = async () => {
        if (item && item.file && item.file.uri) {
          soundRef.current = await Sound.initializeSound(
            { uri: item.file.uri },
            {},
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
      if (soundRef.current) {
        if (item.paused) {
          if (soundRef.current.pauseAsync) await soundRef.current.pauseAsync();
        } else {
          if (soundRef.current.playAsync) await soundRef.current.playAsync();
          if (soundRef.current.setProgressUpdateIntervalAsync)
            await soundRef.current.setProgressUpdateIntervalAsync(60);
        }
      }
    };
    // For expo CLI
    if (!Sound.Player) {
      initalPlayPause();
    }
  }, [item.paused]);

  const onSpeedChangeHandler = async () => {
    if (currentSpeed === 2.0) {
      setCurrentSpeed(1.0);
      if (soundRef.current && soundRef.current.setRateAsync) {
        await soundRef.current.setRateAsync(1.0);
      }
    } else {
      if (currentSpeed === 1.0) {
        setCurrentSpeed(1.5);
        if (soundRef.current && soundRef.current.setRateAsync) {
          await soundRef.current.setRateAsync(1.5);
        }
      } else if (currentSpeed === 1.5) {
        setCurrentSpeed(2.0);
        if (soundRef.current && soundRef.current.setRateAsync) {
          await soundRef.current.setRateAsync(2.0);
        }
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
        fileUploadPreview: { filenameText },
      },
    },
  } = useTheme();

  const progressValueInSeconds = (item.duration as number) * (item.progress as number);

  const progressDuration = progressValueInSeconds
    ? progressValueInSeconds / 3600 >= 1
      ? dayjs.duration(progressValueInSeconds, 'second').format('HH:mm:ss')
      : dayjs.duration(progressValueInSeconds, 'second').format('mm:ss')
    : dayjs.duration(item.duration ?? 0, 'second').format('mm:ss');

  return (
    <View
      accessibilityLabel='audio-attachment-preview'
      onLayout={({ nativeEvent }) => {
        setWidth(nativeEvent.layout.width);
      }}
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
      <Pressable
        accessibilityLabel='Play Pause Button'
        onPress={() => handlePlayPause()}
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
      <View style={[styles.leftContainer, leftContainer]}>
        <Text
          accessibilityLabel='File Name'
          numberOfLines={1}
          style={[
            styles.filenameText,
            {
              color: black,
              width:
                16 - // 16 = horizontal padding
                40 - // 40 = file icon size
                24 - // 24 = close icon size
                24, // 24 = internal padding
            },
            I18nManager.isRTL ? { writingDirection: 'rtl' } : { writingDirection: 'ltr' },
            filenameText,
          ]}
        >
          {getTrimmedAttachmentTitle(item.file.name)}
        </Text>
        <View style={styles.audioInfo}>
          {/* <ExpoSoundPlayer filePaused={!!item.paused} soundRef={soundRef} /> */}
          {Sound.Player && (
            <Sound.Player
              onEnd={handleEnd}
              onLoad={handleLoad}
              onProgress={handleProgress}
              paused={item.paused as boolean}
              rate={currentSpeed}
              soundRef={soundRef}
              testID='sound-player'
              uri={item.file.uri}
            />
          )}
          <Text style={[styles.progressDurationText, { color: grey_dark }, progressDurationText]}>
            {progressDuration}
          </Text>
          {!hideProgressBar && (
            <View style={[styles.progressControlContainer, progressControlContainer]}>
              {item.file.waveform_data ? (
                <WaveProgressBar
                  amplitudesCount={35}
                  onPlayPause={handlePlayPause}
                  onProgressDrag={(position) => {
                    if (item.file.waveform_data) {
                      const progress = (position / 30) * (item.duration as number);
                      handleProgressDrag(progress);
                    }
                  }}
                  progress={item.progress as number}
                  waveformData={item.file.waveform_data}
                />
              ) : (
                <ProgressControl
                  duration={item.duration as number}
                  filledColor={accent_blue}
                  onPlayPause={handlePlayPause}
                  onProgressDrag={handleProgressDrag}
                  progress={item.progress as number}
                  testID='progress-control'
                  width={width / 2}
                />
              )}
            </View>
          )}
        </View>
      </View>
      {showSpeedSettings && (
        <View style={[styles.rightContainer, rightContainer]}>
          {item.progress === 0 || item.progress === 1 ? (
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
              >{`x${currentSpeed}`}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  audioInfo: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
  },
  container: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  filenameText: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingBottom: 12,
    paddingLeft: 8,
  },
  leftContainer: {
    justifyContent: 'space-around',
  },
  playPauseButton: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 50,
    display: 'flex',
    elevation: 4,
    justifyContent: 'center',
    paddingVertical: 2,
    shadowOffset: {
      height: 2,
      width: 0,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    width: 36,
  },
  progressControlContainer: {},
  progressDurationText: {
    fontSize: 12,
    paddingLeft: 10,
    paddingRight: 8,
  },
  rightContainer: {
    marginLeft: 10,
  },
  speedChangeButton: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 50,
    elevation: 4,
    justifyContent: 'center',
    paddingVertical: 5,
    shadowOffset: {
      height: 2,
      width: 0,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    width: 36,
  },
  speedChangeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

AudioAttachment.displayName = 'AudioAttachment{messageInput{audioAttachment}}';
