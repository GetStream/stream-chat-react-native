import React, { useEffect } from 'react';
import { I18nManager, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

import { FileUpload, useTheme } from '../../contexts';
import { Pause, Play } from '../../icons';
import {
  PlaybackStatus,
  Sound,
  SoundReturnType,
  VideoPayloadData,
  VideoProgressData,
} from '../../native';
import { ProgressControl } from '../ProgressControl/ProgressControl';

dayjs.extend(duration);

const FILE_PREVIEW_HEIGHT = 70;

const styles = StyleSheet.create({
  fileContainer: {
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    height: FILE_PREVIEW_HEIGHT,
    paddingLeft: 8,
    paddingRight: 8,
  },
  fileContentContainer: { flexDirection: 'row', paddingRight: 40 },
  filenameText: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingLeft: 10,
  },
  fileTextContainer: {
    justifyContent: 'space-around',
  },
  flatList: { marginBottom: 12, maxHeight: FILE_PREVIEW_HEIGHT * 2.5 + 16 },
  overlay: {
    borderRadius: 12,
    marginLeft: 8,
    marginRight: 8,
  },
  progressControlView: {
    flex: 8,
  },
  progressDurationText: {
    flex: 4,
    fontSize: 12,
    paddingLeft: 10,
    paddingRight: 8,
  },
  roundedView: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 50,
    display: 'flex',
    elevation: 4,
    height: 36,
    justifyContent: 'center',
    shadowOffset: {
      height: 2,
      width: 0,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    width: 36,
  },
});

export type AudioAttachmentPropsWithContext = {
  item: Omit<FileUpload, 'state'>;
  onLoad: (index: string, duration: number) => void;
  onPlayPause: (index: string, pausedStatus?: boolean) => void;
  onProgress: (index: string, currentTime?: number, hasEnd?: boolean) => void;
  testID?: string;
};

const AudioAttachmentWithContext = (props: AudioAttachmentPropsWithContext) => {
  const soundRef = React.useRef<SoundReturnType | null>(null);
  const { item, onLoad, onPlayPause, onProgress } = props;

  const handleLoad = (payload: VideoPayloadData) => {
    onLoad(item.id, payload.duration);
  };

  const handleProgress = (data: VideoProgressData) => {
    if (data.currentTime && data.seekableDuration) {
      onProgress(item.id, data.currentTime);
    }
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
          if (soundRef.current.playAsync) await soundRef.current.playAsync();
          onPlayPause(item.id, false);
        } else {
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
    if (soundRef.current?.seek) soundRef.current.seek(position);
    if (soundRef.current?.setPositionAsync) {
      await soundRef.current.setPositionAsync(position * 1000);
    }
  };

  const handleEnd = () => {
    onPlayPause(item.id, true);
    onProgress(item.id, item.duration, true);
  };

  const onPlaybackStatusUpdate = (playbackStatus: PlaybackStatus) => {
    if (!playbackStatus.isLoaded) {
      // Update your UI for the unloaded state
      if (playbackStatus.error) {
        console.log(`Encountered a fatal error during playback: ${playbackStatus.error}`);
      }
    } else {
      const { durationMillis, positionMillis } = playbackStatus;
      onLoad(item.id, durationMillis / 1000);
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
  }, []);

  // This is needed for expo applications where the rerender doesn't occur on time thefore you need to update the state of the sound.
  useEffect(() => {
    const initalPlayPause = async () => {
      if (soundRef.current) {
        if (item.paused) {
          if (soundRef.current.pauseAsync) await soundRef.current.pauseAsync();
        } else {
          if (soundRef.current.playAsync) await soundRef.current.playAsync();
        }
      }
    };
    if (!Sound.Player) {
      initalPlayPause();
    }
  }, [item.paused]);

  const {
    theme: {
      colors: { accent_blue, black, grey_dark, static_black, static_white },
      messageInput: {
        fileUploadPreview: {
          audioAttachment: { progressControlView, progressDurationText, roundedView },
          fileContentContainer,
          filenameText,
          fileTextContainer,
        },
      },
    },
  } = useTheme();

  const progressValueInSeconds = (item.duration as number) * (item.progress as number);

  const progressDuration = progressValueInSeconds
    ? progressValueInSeconds / 3600 >= 1
      ? dayjs.duration(progressValueInSeconds, 'second').format('HH:mm:ss')
      : dayjs.duration(progressValueInSeconds, 'second').format('mm:ss')
    : '00:00';

  const lastIndexOfDot = item.file.name.lastIndexOf('.');

  return (
    <View style={[styles.fileContentContainer, fileContentContainer]}>
      <TouchableOpacity
        accessibilityLabel='Play Pause Button'
        onPress={() => handlePlayPause()}
        style={[
          styles.roundedView,
          roundedView,
          { backgroundColor: static_white, shadowColor: black },
        ]}
      >
        {item.paused ? (
          <Play height={24} pathFill={static_black} width={24} />
        ) : (
          <Pause height={24} pathFill={static_black} width={24} />
        )}
      </TouchableOpacity>
      <View style={[styles.fileTextContainer, fileTextContainer]}>
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
          {item.file.name.slice(0, 12) + '...' + item.file.name.slice(lastIndexOfDot)}
        </Text>
        <View
          style={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'row',
          }}
        >
          {/* <ExpoSoundPlayer filePaused={!!item.paused} soundRef={soundRef} /> */}
          {Sound.Player && (
            <Sound.Player
              onEnd={handleEnd}
              onLoad={handleLoad}
              onProgress={handleProgress}
              paused={item.paused as boolean}
              soundRef={soundRef}
              testID='sound-player'
              uri={item.file.uri}
            />
          )}
          <Text style={[styles.progressDurationText, { color: grey_dark }, progressDurationText]}>
            {progressDuration}
          </Text>
          <View style={[styles.progressControlView, progressControlView]}>
            <ProgressControl
              duration={item.duration as number}
              filledColor={accent_blue}
              onPlayPause={handlePlayPause}
              onProgressDrag={handleProgressDrag}
              progress={item.progress as number}
              testID='progress-control'
              width={120}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

export type AudioAttachmentProps = Partial<AudioAttachmentPropsWithContext> & {
  item: Omit<FileUpload, 'state'>;
  onLoad: (index: string, duration: number) => void;
  onPlayPause: (index: string, pausedStatus?: boolean) => void;
  onProgress: (index: string, currentTime?: number, hasEnd?: boolean) => void;
  testID: string;
};

/**
 * AudioAttachment
 * UI Component to preview the audio files
 */
export const AudioAttachment = (props: AudioAttachmentProps) => (
  <AudioAttachmentWithContext {...props} />
);

AudioAttachment.displayName = 'AudioAttachment{messageInput{autoAttachment}}';
