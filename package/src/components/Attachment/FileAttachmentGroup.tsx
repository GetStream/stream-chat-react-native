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

import type { DefaultStreamChatGenerics } from '../../types/types';

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
});

export type FileAttachmentGroupPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessageContextValue<StreamChatGenerics>, 'files'> &
  Pick<MessagesContextValue<StreamChatGenerics>, 'Attachment'> & {
    /**
     * The unique id for the message with file attachments
     */
    messageId: string;
    styles?: Partial<{
      attachmentContainer: StyleProp<ViewStyle>;
      container: StyleProp<ViewStyle>;
    }>;
  };

const FileAttachmentGroupWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: FileAttachmentGroupPropsWithContext<StreamChatGenerics>,
) => {
  const { Attachment, files, messageId, styles: stylesProp = {} } = props;

  const {
    theme: {
      messageSimple: {
        fileAttachmentGroup: { container },
      },
    },
  } = useTheme('FileAttachmentGroup');

  return (
    <View style={[styles.container, container, stylesProp.container]}>
      {files.map((file, index) => (
        <View
          key={`${messageId}-${index}`}
          style={[
            { paddingBottom: index !== files.length - 1 ? 4 : 0 },
            stylesProp.attachmentContainer,
          ]}
        >
          <Attachment attachment={file} />
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

  const filesEqual = prevFiles.length === nextFiles.length;

  return filesEqual;
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

  const { files: contextFiles } = useMessageContext<StreamChatGenerics>('FileAttachmentGroup');

  const { Attachment = AttachmentDefault } =
    useMessagesContext<StreamChatGenerics>('FileAttachmentGroup');

  const files = propFiles || contextFiles;

  if (!files.length) return null;

  return (
    <MemoizedFileAttachmentGroup
      {...{
        Attachment,
        files,
        messageId,
      }}
    />
  );
};

FileAttachmentGroup.displayName = 'FileAttachmentGroup{messageSimple{fileAttachmentGroup}}';
