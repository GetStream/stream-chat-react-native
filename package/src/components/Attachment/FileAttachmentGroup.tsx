import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

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
import { primitives } from '../../theme';

export type FileAttachmentGroupPropsWithContext = Pick<MessageContextValue, 'files' | 'message'> &
  Pick<MessagesContextValue, 'Attachment'> & {
    styles?: Partial<{
      attachmentContainer: StyleProp<ViewStyle>;
      container: StyleProp<ViewStyle>;
    }>;
  };

const FileAttachmentGroupWithContext = (props: FileAttachmentGroupPropsWithContext) => {
  const { Attachment, files, message, styles: stylesProp = {} } = props;

  const {
    theme: {
      messageSimple: {
        fileAttachmentGroup: { attachmentContainer, container },
      },
    },
  } = useTheme();

  const showBottomPadding = files.length > 1 && !message.text && message.quoted_message;

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: files.length > 1 ? primitives.spacingXs : 0,
          paddingTop: files.length > 1 ? primitives.spacingXs : 0,
          paddingBottom: showBottomPadding ? primitives.spacingXs : 0,
        },
        container,
        stylesProp.container,
      ]}
    >
      {files.map((file, index) => (
        <View
          key={`file-by-attachment-group-${message.id}-${index}`}
          style={[styles.item, stylesProp.attachmentContainer, attachmentContainer]}
        >
          <Attachment attachment={file} />
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
    gap: primitives.spacingXs,
    alignSelf: 'center',
  },
  item: {
    borderRadius: primitives.radiusLg,
    overflow: 'hidden',
  },
});

FileAttachmentGroup.displayName = 'FileAttachmentGroup{messageSimple{fileAttachmentGroup}}';
