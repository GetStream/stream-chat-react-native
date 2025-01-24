import React, { useEffect, useMemo, useState } from 'react';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

import { useTheme } from '../../contexts';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { Audio, Pause, Play } from '../../icons';
import {
  PlaybackStatus,
  Sound,
  SoundReturnType,
  VideoPayloadData,
  VideoProgressData,
  VideoSeekResponse,
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
  const [progressControlTextWidth, setProgressControlTextWidth] = useState(0);
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
  } = props;
  const { changeAudioSpeed, pauseAudio, playAudio, seekAudio } = useAudioPlayer({ soundRef });
  const isExpoCLI = !Sound.Player && Sound.initializeSound;

  /** This is for Native CLI Apps */
  const handleLoad = (payload: VideoPayloadData) => {
    if (isExpoCLI) return;
    pauseAudio();
    onLoad(item.id, item.duration || payload.duration);
  };

  /** This is for Native CLI Apps */
  const handleProgress = (data: VideoProgressData) => {
    const { currentTime, seekableDuration } = data;
    if (currentTime < seekableDuration && !audioFinished) {
      onProgress(item.id, currentTime);
    } else {
      setAudioFinished(true);
    }
  };

  const onPlaybackStateChanged = (playbackState: PlaybackStatus) => {
    if (playbackState.isPlaying === false) {
      onPlayPause(item.id, true);
    } else {
      onPlayPause(item.id, false);
    }
  };

  const onSeek = (seekResponse: VideoSeekResponse) => {
    setAudioFinished(false);
    onProgress(item.id, seekResponse.currentTime);
  };

  const handlePlayPause = async () => {
    if (item.paused) {
      await playAudio();
    } else {
      await pauseAudio();
    }
  };

  /** This is for Native CLI Apps */
  const handleEnd = async () => {
    setAudioFinished(false);
    await seekAudio(0);
    await pauseAudio();
  };

  const dragStart = async () => {
    await pauseAudio();
  };

  const dragEnd = async (currentTime: number) => {
    await seekAudio(currentTime);
    await playAudio();
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
        onPlayPause(item.id, false);
        onProgress(item.id, positionMillis / 1000);
      } else {
        onPlayPause(item.id, true);
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

  // This is for Expo CLI, sound initialization is done here.
  useEffect(() => {
    if (isExpoCLI) {
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
        fileUploadPreview: { filenameText },
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
      <View
        onLayout={({ nativeEvent }) => {
          setWidth(nativeEvent.layout.width);
        }}
        style={[styles.leftContainer, leftContainer]}
      >
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
          {getTrimmedAttachmentTitle(item.file.name)}
        </Text>
        <View style={styles.audioInfo}>
          {/* <ExpoSoundPlayer filePaused={!!item.paused} soundRef={soundRef} /> */}
          {Sound.Player && (
            <Sound.Player
              onEnd={handleEnd}
              onLoad={handleLoad}
              onPlaybackStateChanged={onPlaybackStateChanged}
              onProgress={handleProgress}
              onSeek={onSeek}
              rate={currentSpeed}
              soundRef={soundRef}
              testID='sound-player'
              uri={item.file.uri}
            />
          )}
          <Text
            onLayout={({ nativeEvent }) => {
              setProgressControlTextWidth(nativeEvent.layout.width);
            }}
            style={[styles.progressDurationText, { color: grey_dark }, progressDurationText]}
          >
            {progressDuration}
          </Text>
          {!hideProgressBar && (
            <View style={[styles.progressControlContainer, progressControlContainer]}>
              {item.file.waveform_data ? (
                <WaveProgressBar
                  amplitudesCount={35}
                  onEndDrag={(position) => {
                    if (item.file.waveform_data) {
                      const progress = (position / 30) * (item.duration as number);
                      dragEnd(progress);
                    }
                  }}
                  onStartDrag={dragStart}
                  progress={item.progress as number}
                  waveformData={item.file.waveform_data}
                />
              ) : (
                <ProgressControl
                  duration={item.duration as number}
                  filledColor={accent_blue}
                  onEndDrag={dragEnd}
                  onStartDrag={dragStart}
                  progress={item.progress as number}
                  testID='progress-control'
                  width={width - progressControlTextWidth}
                />
              )}
            </View>
          )}
        </View>
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
              >{`x${currentSpeed}`}</Text>
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
  },
  leftContainer: {
    justifyContent: 'space-around',
    marginHorizontal: 16,
    width: '60%',
  },
  playPauseButton: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 50,
    elevation: 4,
    justifyContent: 'center',
    padding: 2,
    shadowOffset: {
      height: 2,
      width: 0,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  progressControlContainer: {},
  progressDurationText: {
    fontSize: 12,
    marginRight: 4,
  },
  rightContainer: {
    marginLeft: 'auto',
  },
  speedChangeButton: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 50,
    elevation: 4,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowOffset: {
      height: 2,
      width: 0,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  speedChangeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

AudioAttachment.displayName = 'AudioAttachment{messageInput{audioAttachment}}';
