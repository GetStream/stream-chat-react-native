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
import { isSoundPackageAvailable } from '../../native';

import { FileTypes } from '../../types/types';

export type FileAttachmentGroupPropsWithContext = Pick<MessageContextValue, 'files'> &
  Pick<MessagesContextValue, 'Attachment' | 'AudioAttachment'> & {
    /**
     * The unique id for the message with file attachments
     */
    messageId: string;
    styles?: Partial<{
      attachmentContainer: StyleProp<ViewStyle>;
      container: StyleProp<ViewStyle>;
    }>;
  };

type FilesToDisplayType = Attachment & {
  duration: number;
  paused: boolean;
  progress: number;
};

const FileAttachmentGroupWithContext = (props: FileAttachmentGroupPropsWithContext) => {
  const { Attachment, AudioAttachment, files, messageId, styles: stylesProp = {} } = props;
  const [filesToDisplay, setFilesToDisplay] = useState<FilesToDisplayType[]>(() =>
    files.map((file) => ({ ...file, duration: file.duration || 0, paused: true, progress: 0 })),
  );

  useEffect(() => {
    setFilesToDisplay(
      files.map((file) => ({ ...file, duration: file.duration || 0, paused: true, progress: 0 })),
    );
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
  const onProgress = (index: string, progress: number) => {
    setFilesToDisplay((prevFilesToDisplay) =>
      prevFilesToDisplay.map((filesToDisplay, id) => ({
        ...filesToDisplay,
        progress: id.toString() === index ? progress : filesToDisplay.progress,
      })),
    );
  };

  // The handler which controls or sets the paused/played state of the audio.
  const onPlayPause = (index: string, pausedStatus?: boolean) => {
    if (pausedStatus === false) {
      // If the status is false we set the audio with the index as playing and the others as paused.
      setFilesToDisplay((prevFilesToDisplay) =>
        prevFilesToDisplay.map((fileToDisplay, id) => ({
          ...fileToDisplay,
          paused: id.toString() !== index,
        })),
      );
    } else {
      // If the status is true we simply set all the audio's paused state as true.
      setFilesToDisplay((prevFilesToDisplay) =>
        prevFilesToDisplay.map((fileToDisplay) => ({
          ...fileToDisplay,
          paused: true,
        })),
      );
    }
  };

  const {
    theme: {
      messageSimple: {
        fileAttachmentGroup: { attachmentContainer, container },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, container, stylesProp.container]}>
      {filesToDisplay.map((file, index) => (
        <View
          key={`file-by-attachment-group-${messageId}-${index}`}
          style={[
            { paddingBottom: index !== files.length - 1 ? 4 : 0 },
            stylesProp.attachmentContainer,
            attachmentContainer,
          ]}
        >
          {(file.type === FileTypes.Audio || file.type === FileTypes.VoiceRecording) &&
          isSoundPackageAvailable() ? (
            <AudioAttachment
              item={{
                ...file,
                id: index.toString(),
                type: file.type,
              }}
              onLoad={onLoad}
              onPlayPause={onPlayPause}
              onProgress={onProgress}
              showSpeedSettings={true}
            />
          ) : (
            <Attachment attachment={file} />
          )}
        </View>
      ))}
    </View>
  );
};

const areEqual = (
  prevProps: FileAttachmentGroupPropsWithContext,
  nextProps: FileAttachmentGroupPropsWithContext,
) => {
  const { files: prevFiles } = prevProps;
  const { files: nextFiles } = nextProps;

  return prevFiles.length === nextFiles.length;
};

const MemoizedFileAttachmentGroup = React.memo(
  FileAttachmentGroupWithContext,
  areEqual,
) as typeof FileAttachmentGroupWithContext;

export type FileAttachmentGroupProps = Partial<
  Omit<FileAttachmentGroupPropsWithContext, 'messageId'>
> &
  Pick<FileAttachmentGroupPropsWithContext, 'messageId'>;

export const FileAttachmentGroup = (props: FileAttachmentGroupProps) => {
  const { files: propFiles, messageId } = props;

  const { files: contextFiles } = useMessageContext();

  const { Attachment = AttachmentDefault, AudioAttachment } = useMessagesContext();

  const files = propFiles || contextFiles;

  if (!files.length) {
    return null;
  }

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

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
});

FileAttachmentGroup.displayName = 'FileAttachmentGroup{messageSimple{fileAttachmentGroup}}';
