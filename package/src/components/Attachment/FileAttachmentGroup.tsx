import React, { useEffect, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Attachment, isAudioAttachment, isVoiceRecordingAttachment } from 'stream-chat';

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

export type FileAttachmentGroupPropsWithContext = Pick<MessageContextValue, 'files' | 'message'> &
  Pick<MessagesContextValue, 'Attachment' | 'AudioAttachment'> & {
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
  const { Attachment, AudioAttachment, files, message, styles: stylesProp = {} } = props;

  const [filesToDisplay, setFilesToDisplay] = useState<FilesToDisplayType[]>(() =>
    files.map((file) => ({ ...file, duration: file.duration || 0, paused: true, progress: 0 })),
  );

  useEffect(() => {
    setFilesToDisplay(
      files.map((file) => ({ ...file, duration: file.duration || 0, paused: true, progress: 0 })),
    );
  }, [files]);

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
          key={`file-by-attachment-group-${message.id}-${index}`}
          style={[
            { paddingBottom: index !== files.length - 1 ? 4 : 0 },
            stylesProp.attachmentContainer,
            attachmentContainer,
          ]}
        >
          {(isAudioAttachment(file) || isVoiceRecordingAttachment(file)) &&
          isSoundPackageAvailable() ? (
            <AudioAttachment
              item={{ ...file, id: index.toString(), type: file.type }}
              message={message}
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
  const { files: prevFiles, message: prevMessage } = prevProps;
  const { files: nextFiles, message: nextMessage } = nextProps;

  const messageEqual = prevMessage?.id === nextMessage?.id;
  if (!messageEqual) {
    return false;
  }

  return prevFiles.length === nextFiles.length;
};

const MemoizedFileAttachmentGroup = React.memo(
  FileAttachmentGroupWithContext,
  areEqual,
) as typeof FileAttachmentGroupWithContext;

export type FileAttachmentGroupProps = Partial<FileAttachmentGroupPropsWithContext>;

export const FileAttachmentGroup = (props: FileAttachmentGroupProps) => {
  const { files: propFiles } = props;

  const { files: contextFiles, message } = useMessageContext();

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
        message,
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
