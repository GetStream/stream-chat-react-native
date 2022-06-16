import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

import {
  FileUpload,
  MessageInputContextValue,
  useMessageInputContext,
  useTheme,
} from '../../contexts';
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
    marginBottom: 8,
    paddingLeft: 8,
    paddingRight: 8,
  },
  fileContentContainer: { flexDirection: 'row' },
  filenameText: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingLeft: 10,
  },
  fileSizeText: {
    fontSize: 12,
    paddingLeft: 10,
    paddingRight: 8,
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
  roundedView: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 50,
    display: 'flex',
    elevation: 4,
    height: 36,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      height: 2,
      width: 0,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    width: 36,
  },
});

type AudioAttachmentUploadPreviewPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  MessageInputContextValue<StreamChatGenerics>,
  'fileUploads' | 'removeFile' | 'uploadFile'
> & {
  index: number;
  item: FileUpload;
  onLoad: (index: string, duration?: number) => void;
  onPlayPause: (index: string) => void;
  onProgress: (index: string, currentTime: number, duration: number) => void;
};

const AudioAttachmentUploadPreviewWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: AudioAttachmentUploadPreviewPropsWithContext<StreamChatGenerics>,
) => {
  const soundRef = useRef<SoundReturnType | null>(null);
  const { fileUploads, index, item, onLoad, onPlayPause, onProgress } = props;

  const handleLoad = (payload: VideoPayloadData) => {
    onLoad(item.id, payload.duration);
  };

  const handleProgress = (data: VideoProgressData) => {
    if (data.currentTime && data.seekableDuration) {
      onProgress(item.id, data.currentTime, data.seekableDuration);
    }
  };

  const handlePlayPause = async () => {
    if (soundRef.current) {
      if (item.progress === 1) {
        if (soundRef.current.seek) soundRef.current.seek(0);
        if (soundRef.current.setPositionAsync) soundRef.current.setPositionAsync(0);
      }
      if (item.paused) {
        if (soundRef.current.playAsync) await soundRef.current.playAsync();
      } else {
        if (soundRef.current.pauseAsync) await soundRef.current.pauseAsync();
      }
      onPlayPause(item.id);
    }
  };

  const handleProgressDrag = async (position: number) => {
    onProgress(item.id, position, item.duration as number);
    if (soundRef.current?.seek) soundRef.current.seek(position);
    if (soundRef.current?.setPositionAsync) {
      await soundRef.current.setPositionAsync(position * 1000);
    }
  };

  const handleEnd = () => {
    onPlayPause(item.id);
    onProgress(item.id, 1, 1);
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
        onProgress(item.id, positionMillis, durationMillis);
      } else {
        // Update your UI for the paused state
      }

      if (playbackStatus.isBuffering) {
        // Update your UI for the buffering state
      }

      if (playbackStatus.didJustFinish && !playbackStatus.isLooping) {
        // The player has just finished playing and will stop. Maybe you want to play something else?
        onPlayPause(item.id);
        onProgress(item.id, 1, 1);
      }
    }
  };

  useEffect(() => {
    if (Sound.Player === null) {
      const initiateSound = async () => {
        if (item && item.file && item.file.uri) {
          soundRef.current = await Sound.initializeSound(
            { uri: item.file.uri as string },
            {},
            onPlaybackStatusUpdate,
          );
        }
      };
      initiateSound();
    }

    return () => {
      if (soundRef.current?.stopAsync) soundRef.current.stopAsync();
    };
  }, []);

  const {
    theme: {
      colors: { accent_blue, black, grey_dark, grey_whisper },
      messageInput: {
        fileUploadPreview: {
          fileContainer,
          fileContentContainer,
          filenameText,
          fileSizeText,
          fileTextContainer,
          roundedView,
        },
      },
    },
  } = useTheme();

  const progressValueInSeconds = item.duration as number;

  const progressDuration = progressValueInSeconds
    ? progressValueInSeconds / 3600 >= 1
      ? dayjs.duration(progressValueInSeconds, 'second').format('HH:mm:ss')
      : dayjs.duration(progressValueInSeconds, 'second').format('mm:ss')
    : '00:00';

  const lastIndexOfDot = item.file.name.lastIndexOf('.');

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
          borderColor: grey_whisper,
          width: -16,
        },
        fileContainer,
      ]}
    >
      <View style={[styles.fileContentContainer, fileContentContainer]}>
        <TouchableOpacity
          onPress={() => {
            handlePlayPause();
          }}
          style={[styles.roundedView, roundedView]}
        >
          {item.paused ? (
            <Play height={24} pathFill={'#000'} width={24} />
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
            {item.file.name.slice(0, 12) + '...' + item.file.name.slice(lastIndexOfDot)}
          </Text>
          <View
            style={{
              alignItems: 'center',
              display: 'flex',
              flexDirection: 'row',
            }}
          >
            {Sound.Player && (
              <Sound.Player
                onEnd={handleEnd}
                onLoad={handleLoad}
                onProgress={handleProgress}
                paused={item.paused as boolean}
                soundRef={soundRef}
                uri={item.file.uri}
              />
            )}
            <Text style={[styles.fileSizeText, { color: grey_dark }, fileSizeText]}>
              {progressDuration}
            </Text>
            <ProgressControl
              duration={item.duration as number}
              filledColor={accent_blue}
              onPlayPause={handlePlayPause}
              onProgressDrag={handleProgressDrag}
              progress={item.progress as number}
              width={110}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: AudioAttachmentUploadPreviewPropsWithContext<StreamChatGenerics>,
  nextProps: AudioAttachmentUploadPreviewPropsWithContext<StreamChatGenerics>,
) => {
  const { fileUploads: prevFileUploads, item: prevItem } = prevProps;
  const { fileUploads: nextFileUploads, item: nextItem } = nextProps;

  const isItemEqual =
    prevItem.duration === nextItem.duration &&
    prevItem.progress === nextItem.progress &&
    prevItem.paused === nextItem.paused;

  if (!isItemEqual) return false;

  const isFileUploadsEqual =
    prevFileUploads.length === nextFileUploads.length &&
    prevFileUploads.every(
      (prevFileUpload, index) =>
        prevFileUpload.state === nextFileUploads[index].state &&
        prevFileUpload.paused === nextFileUploads[index].paused &&
        prevFileUpload.progress === nextFileUploads[index].progress &&
        prevFileUpload.duration === nextFileUploads[index].duration,
    );

  if (!isFileUploadsEqual) return false;

  return true;
};

const MemoizedAudioAttachmentUploadPreview = React.memo(
  AudioAttachmentUploadPreviewWithContext,
  areEqual,
) as typeof AudioAttachmentUploadPreviewWithContext;

export type FileUploadPreviewProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<AudioAttachmentUploadPreviewPropsWithContext<StreamChatGenerics>> & {
  index: number;
  item: FileUpload;
  onLoad: (index: string, duration?: number) => void;
  onPlayPause: (index: string) => void;
  onProgress: (index: string, currentTime: number, duration: number) => void;
};

/**
 * FileUploadPreview
 * UI Component to preview the files set for upload
 */
export const AudioAttachmentUploadPreview = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: FileUploadPreviewProps<StreamChatGenerics>,
) => {
  const { fileUploads, removeFile, uploadFile } = useMessageInputContext<StreamChatGenerics>();

  return (
    <MemoizedAudioAttachmentUploadPreview {...{ fileUploads, removeFile, uploadFile }} {...props} />
  );
};

AudioAttachmentUploadPreview.displayName =
  'AudioAttachmentUploadPreview{messageInput{autoAttachmentUploadPreview}}';
