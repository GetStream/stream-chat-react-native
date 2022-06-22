import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

import { MessageInputContextValue, useMessageInputContext, useTheme } from '../../contexts';
import { Pause, Play } from '../../icons';
import {
  PlaybackStatus,
  Sound,
  SoundReturnType,
  VideoPayloadData,
  VideoProgressData,
} from '../../native';
import type { DefaultStreamChatGenerics } from '../../types/types';
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
  fileContentContainer: { flexDirection: 'row' },
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

export type AudioAttachmentUploadPreviewPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  MessageInputContextValue<StreamChatGenerics>,
  'fileUploads' | 'removeFile' | 'uploadFile'
> & {
  duration: number;
  fileId: string;
  fileName: string;
  index: number;
  onLoad: (index: string, duration: number) => void;
  onPlayPause: (index: string, status?: boolean) => void;
  onProgress: (index: string, currentTime?: number, hasEnd?: boolean) => void;
  paused: boolean;
  progress: number;
  fileUrl?: string;
};

const AudioAttachmentUploadPreviewWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: AudioAttachmentUploadPreviewPropsWithContext<StreamChatGenerics>,
) => {
  const soundRef = useRef<SoundReturnType | null>(null);
  const {
    duration,
    fileId,
    fileName,
    fileUploads,
    fileUrl,
    index,
    onLoad,
    onPlayPause,
    onProgress,
    paused,
    progress,
  } = props;

  const handleLoad = (payload: VideoPayloadData) => {
    onLoad(fileId, payload.duration);
  };

  const handleProgress = (data: VideoProgressData) => {
    if (data.currentTime && data.seekableDuration) {
      onProgress(fileId, data.currentTime);
    }
  };

  const handlePlayPause = async (isPausedStatusAvailable?: boolean) => {
    if (soundRef.current) {
      if (isPausedStatusAvailable === undefined) {
        if (progress === 1) {
          // For native CLI
          if (soundRef.current.seek) soundRef.current.seek(0);
          // For expo CLI
          if (soundRef.current.setPositionAsync) soundRef.current.setPositionAsync(0);
        }
        if (paused) {
          if (soundRef.current.playAsync) await soundRef.current.playAsync();
          onPlayPause(fileId, false);
        } else {
          if (soundRef.current.pauseAsync) await soundRef.current.pauseAsync();
          onPlayPause(fileId, true);
        }
      } else {
        onPlayPause(fileId, isPausedStatusAvailable);
      }
    }
  };

  const handleProgressDrag = async (position: number) => {
    onProgress(fileId, position);
    if (soundRef.current?.seek) soundRef.current.seek(position);
    if (soundRef.current?.setPositionAsync) {
      await soundRef.current.setPositionAsync(position * 1000);
    }
  };

  const handleEnd = () => {
    onPlayPause(fileId, true);
    onProgress(fileId, duration, true);
  };

  const onPlaybackStatusUpdate = (playbackStatus: PlaybackStatus) => {
    if (!playbackStatus.isLoaded) {
      // Update your UI for the unloaded state
      if (playbackStatus.error) {
        console.log(`Encountered a fatal error during playback: ${playbackStatus.error}`);
      }
    } else {
      const { durationMillis, positionMillis } = playbackStatus;
      onLoad(fileId, durationMillis / 1000);
      // Update your UI for the loaded state
      if (playbackStatus.isPlaying) {
        // Update your UI for the playing state
        onProgress(fileId, positionMillis / 1000);
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
        if (fileUrl) {
          soundRef.current = await Sound.initializeSound(
            { uri: fileUrl },
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
        if (paused) {
          if (soundRef.current.pauseAsync) await soundRef.current.pauseAsync();
        } else {
          if (soundRef.current.playAsync) await soundRef.current.playAsync();
        }
      }
    };
    if (!Sound.Player) {
      initalPlayPause();
    }
  }, [paused]);

  const {
    theme: {
      colors: { accent_blue, black, grey_dark, grey_whisper, white_snow },
      messageInput: {
        fileUploadPreview: {
          audioAttachmentUploadPreview: { progressControlView, progressDurationText, roundedView },
          fileContainer,
          fileContentContainer,
          filenameText,
          fileTextContainer,
        },
      },
    },
  } = useTheme();

  const progressValueInSeconds = (duration as number) * (progress as number);

  const progressDuration = progressValueInSeconds
    ? progressValueInSeconds / 3600 >= 1
      ? dayjs.duration(progressValueInSeconds, 'second').format('HH:mm:ss')
      : dayjs.duration(progressValueInSeconds, 'second').format('mm:ss')
    : '00:00';

  const lastIndexOfDot = fileName.lastIndexOf('.');

  return (
    <View
      style={[
        styles.fileContainer,
        index === fileUploads.length - 1
          ? {
              marginBottom: 0,
            }
          : {},
        {
          backgroundColor: white_snow,
          borderColor: grey_whisper,
          width: 250,
        },
        fileContainer,
      ]}
      testID='audio-attachment-upload-preview'
    >
      <View style={[styles.fileContentContainer, fileContentContainer]}>
        <TouchableOpacity
          onPress={() => handlePlayPause()}
          style={[
            styles.roundedView,
            roundedView,
            { backgroundColor: white_snow, shadowColor: black },
          ]}
        >
          {paused ? (
            <Play height={24} pathFill={black} width={24} />
          ) : (
            <Pause height={24} width={24} />
          )}
        </TouchableOpacity>
        <View style={[styles.fileTextContainer, fileTextContainer]}>
          <Text
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
              filenameText,
            ]}
          >
            {fileName.slice(0, 12) + '...' + fileName.slice(lastIndexOfDot)}
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
                paused={paused}
                soundRef={soundRef}
                uri={fileUrl}
              />
            )}
            <Text style={[styles.progressDurationText, { color: grey_dark }, progressDurationText]}>
              {progressDuration}
            </Text>
            <View style={[styles.progressControlView, progressControlView]}>
              <ProgressControl
                duration={duration}
                filledColor={accent_blue}
                onPlayPause={handlePlayPause}
                onProgressDrag={handleProgressDrag}
                progress={progress}
                width={110}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export type AudioAttachmentUploadPreviewProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<AudioAttachmentUploadPreviewPropsWithContext<StreamChatGenerics>> & {
  duration: number;
  fileId: string;
  fileName: string;
  index: number;
  onLoad: (index: string, duration: number) => void;
  onPlayPause: (index: string, status?: boolean) => void;
  onProgress: (index: string, currentTime?: number, hasEnd?: boolean) => void;
  paused: boolean;
  progress: number;
  fileUrl?: string;
};

/**
 * AudioAttachmentUploadPreview
 * UI Component to preview the audio files set for upload
 */
export const AudioAttachmentUploadPreview = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: AudioAttachmentUploadPreviewProps<StreamChatGenerics>,
) => {
  const { fileUploads, removeFile, uploadFile } = useMessageInputContext<StreamChatGenerics>();

  return (
    <AudioAttachmentUploadPreviewWithContext
      {...{ fileUploads, removeFile, uploadFile }}
      {...props}
    />
  );
};

AudioAttachmentUploadPreview.displayName =
  'AudioAttachmentUploadPreview{messageInput{autoAttachmentUploadPreview}}';
