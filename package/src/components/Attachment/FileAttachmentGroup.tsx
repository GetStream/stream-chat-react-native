import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { isAudioAttachment, isVoiceRecordingAttachment } from 'stream-chat';

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

const FileAttachmentGroupWithContext = (props: FileAttachmentGroupPropsWithContext) => {
  const { Attachment, AudioAttachment, files, messageId, styles: stylesProp = {} } = props;

  const {
    theme: {
      messageSimple: {
        fileAttachmentGroup: { attachmentContainer, container },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, container, stylesProp.container]}>
      {files.map((file, index) => (
        <View
          key={`file-by-attachment-group-${messageId}-${index}`}
          style={[
            { paddingBottom: index !== files.length - 1 ? 4 : 0 },
            stylesProp.attachmentContainer,
            attachmentContainer,
          ]}
        >
          {(isAudioAttachment(file) || isVoiceRecordingAttachment(file)) &&
          isSoundPackageAvailable() ? (
            <AudioAttachment item={file} showSpeedSettings={true} />
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
