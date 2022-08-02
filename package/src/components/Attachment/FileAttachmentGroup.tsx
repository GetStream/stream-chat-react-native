import React, { useEffect, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import type { Attachment } from 'stream-chat';

import { Attachment as AttachmentDefault } from './Attachment';

import {
  MessageContextValue,
  useMessageContext,
} from '../../contexts/messageContext/MessageContext';

import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { isAudioPackageAvailable } from '../../native';

import type { DefaultStreamChatGenerics } from '../../types/types';

const FILE_PREVIEW_HEIGHT = 60;

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
  fileContainer: {
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    height: FILE_PREVIEW_HEIGHT,
    justifyContent: 'space-between',
    paddingLeft: 8,
    paddingRight: 8,
  },
});

export type FileAttachmentGroupPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessageContextValue<StreamChatGenerics>, 'files'> &
  Pick<MessagesContextValue<StreamChatGenerics>, 'Attachment' | 'AudioAttachment'> & {
    /**
     * The unique id for the message with file attachments
     */
    messageId: string;
    styles?: Partial<{
      attachmentContainer: StyleProp<ViewStyle>;
      container: StyleProp<ViewStyle>;
    }>;
  };

type FilesToDisplayType<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Attachment<StreamChatGenerics> & {
  duration: number;
  paused: boolean;
  progress: number;
};

const FileAttachmentGroupWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: FileAttachmentGroupPropsWithContext<StreamChatGenerics>,
) => {
  const { Attachment, AudioAttachment, files, messageId, styles: stylesProp = {} } = props;
  const [filesToDisplay, setFilesToDisplay] = useState<FilesToDisplayType[]>([]);

  useEffect(() => {
    setFilesToDisplay(files.map((file) => ({ ...file, duration: 0, paused: true, progress: 0 })));
  }, [files]);

  // Handler triggered when an audio is loaded in the message input. The initial state is defined for the audio here and the duration is set.
  const onLoad = (index: string, duration: number) => {
    setFilesToDisplay((prevFilesToDisplay) =>
      prevFilesToDisplay.map((fileToDisplay, id) => ({
        ...fileToDisplay,
        duration: id.toString() === index ? duration : fileToDisplay.duration,
      })),
    );
  };

  // The handler which is triggered when the audio progresses/ the thumb is dragged in the progress control. The progressed duration is set here.
  const onProgress = (index: string, currentTime?: number, hasEnd?: boolean) => {
    setFilesToDisplay((prevFileUploads) =>
      prevFileUploads.map((fileUpload, id) => ({
        ...fileUpload,
        progress:
          id.toString() === index
            ? hasEnd
              ? 1
              : currentTime
              ? currentTime / (fileUpload.duration as number)
              : 0
            : fileUpload.progress,
      })),
    );
  };

  // The handler which controls or sets the paused/played state of the audio.
  const onPlayPause = (index: string, pausedStatus?: boolean) => {
    if (pausedStatus === false) {
      // If the status is false we set the audio with the index as playing and the others as paused.
      setFilesToDisplay((prevFileUploads) =>
        prevFileUploads.map((fileUpload, id) => ({
          ...fileUpload,
          paused: id.toString() === index ? false : true,
        })),
      );
    } else {
      // If the status is true we simply set all the audio's paused state as true.
      setFilesToDisplay((prevFileUploads) =>
        prevFileUploads.map((fileUpload) => ({
          ...fileUpload,
          paused: true,
        })),
      );
    }
  };

  const {
    theme: {
      colors: { grey_whisper, white },
      messageSimple: {
        fileAttachmentGroup: { container },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, container, stylesProp.container]}>
      {filesToDisplay.map((file, index) => (
        <View
          key={`${messageId}-${index}`}
          style={[
            { paddingBottom: index !== files.length - 1 ? 4 : 0 },
            stylesProp.attachmentContainer,
          ]}
        >
          {file.type === 'audio' && isAudioPackageAvailable() ? (
            <View
              accessibilityLabel='audio-attachment-preview'
              style={[
                styles.fileContainer,
                index === filesToDisplay.length - 1
                  ? {
                      marginBottom: 0,
                    }
                  : {},
                {
                  backgroundColor: white,
                  borderColor: grey_whisper,
                  width: -16,
                },
              ]}
            >
              <AudioAttachment
                item={{
                  duration: file.duration,
                  file: { name: file.title as string, uri: file.asset_url },
                  id: index.toString(),
                  paused: file.paused,
                  progress: file.progress,
                }}
                onLoad={onLoad}
                onPlayPause={onPlayPause}
                onProgress={onProgress}
                testID='audio-attachment-preview'
              />
            </View>
          ) : (
            <Attachment attachment={file} />
          )}
        </View>
      ))}
    </View>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: FileAttachmentGroupPropsWithContext<StreamChatGenerics>,
  nextProps: FileAttachmentGroupPropsWithContext<StreamChatGenerics>,
) => {
  const { files: prevFiles } = prevProps;
  const { files: nextFiles } = nextProps;

  return prevFiles.length === nextFiles.length;
};

const MemoizedFileAttachmentGroup = React.memo(
  FileAttachmentGroupWithContext,
  areEqual,
) as typeof FileAttachmentGroupWithContext;

export type FileAttachmentGroupProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<Omit<FileAttachmentGroupPropsWithContext<StreamChatGenerics>, 'messageId'>> &
  Pick<FileAttachmentGroupPropsWithContext<StreamChatGenerics>, 'messageId'>;

export const FileAttachmentGroup = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: FileAttachmentGroupProps<StreamChatGenerics>,
) => {
  const { files: propFiles, messageId } = props;

  const { files: contextFiles } = useMessageContext<StreamChatGenerics>();

  const { Attachment = AttachmentDefault, AudioAttachment } =
    useMessagesContext<StreamChatGenerics>();

  const files = propFiles || contextFiles;

  if (!files.length) return null;

  return (
    <MemoizedFileAttachmentGroup
      {...{
        Attachment,
        AudioAttachment,
        files,
        messageId,
      }}
    />
  );
};

FileAttachmentGroup.displayName = 'FileAttachmentGroup{messageSimple{fileAttachmentGroup}}';
