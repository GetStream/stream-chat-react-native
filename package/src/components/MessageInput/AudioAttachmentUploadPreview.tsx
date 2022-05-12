import React, { useEffect, useState } from 'react';
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
import { PlaybackStatus, Sound, SoundReturnType } from '../../native';
import type { DefaultStreamChatGenerics } from '../../types/types';

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
};

const AudioAttachmentUploadPreviewWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: AudioAttachmentUploadPreviewPropsWithContext<StreamChatGenerics>,
) => {
  const [paused, setPaused] = useState<boolean>(true);
  const [duration, setDuration] = useState<number>(0);
  const [sound, setSound] = useState<SoundReturnType | null>(null);
  const { fileUploads, index, item } = props;

  const onPlaybackStatusUpdate = (playbackStatus: PlaybackStatus) => {
    if (!playbackStatus.isLoaded) {
      // Update your UI for the unloaded state
      if (playbackStatus.error) {
        console.log(`Encountered a fatal error during playback: ${playbackStatus.error}`);
      }
    } else {
      setDuration(playbackStatus.durationMillis / 1000);
      // Update your UI for the loaded state
      if (playbackStatus.isPlaying) {
        // Update your UI for the playing state
      } else {
        // Update your UI for the paused state
      }

      if (playbackStatus.isBuffering) {
        // Update your UI for the buffering state
      }

      if (playbackStatus.didJustFinish && !playbackStatus.isLooping) {
        // The player has just finished playing and will stop. Maybe you want to play something else?
        setPaused(true);
      }
    }
  };

  useEffect(() => {
    const initiateSound = async () => {
      if (item && item.file && item.file.uri) {
        const sound = await Sound({
          initialStatus: {},
          onPlaybackStatusUpdate,
          source: { uri: item.file.uri },
        });
        setSound(sound);
      }
    };
    initiateSound();
  }, []);

  const {
    theme: {
      colors: { black, grey_dark, grey_whisper },
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

  const handlePlayPause = async () => {
    if (sound) {
      if (paused) {
        setPaused(false);
        await sound.playAsync();
      } else {
        setPaused(true);
        await sound.pauseAsync();
      }
    }
  };

  const videoDuration = duration
    ? duration / 3600 >= 1
      ? dayjs.duration(duration, 'second').format('HH:mm:ss')
      : dayjs.duration(duration, 'second').format('mm:ss')
    : null;

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
        <TouchableOpacity onPress={handlePlayPause} style={[styles.roundedView, roundedView]}>
          {paused ? (
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
          <Text style={[styles.fileSizeText, { color: grey_dark }, fileSizeText]}>
            {videoDuration}
          </Text>
        </View>
      </View>
    </View>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: AudioAttachmentUploadPreviewPropsWithContext<StreamChatGenerics>,
  nextProps: AudioAttachmentUploadPreviewPropsWithContext<StreamChatGenerics>,
) => {
  const { fileUploads: prevFileUploads } = prevProps;
  const { fileUploads: nextFileUploads } = nextProps;

  return (
    prevFileUploads.length === nextFileUploads.length &&
    prevFileUploads.every(
      (prevFileUpload, index) => prevFileUpload.state === nextFileUploads[index].state,
    )
  );
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
