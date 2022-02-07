import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import type { ExtendableGenerics } from 'stream-chat';

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
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = Pick<MessageContextValue<StreamChatClient>, 'files'> &
  Pick<MessagesContextValue<StreamChatClient>, 'Attachment'> & {
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
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  props: FileAttachmentGroupPropsWithContext<StreamChatClient>,
) => {
  const { Attachment, files, messageId, styles: stylesProp = {} } = props;

  const {
    theme: {
      messageSimple: {
        fileAttachmentGroup: { container },
      },
    },
  } = useTheme();

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

const areEqual = <StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics>(
  prevProps: FileAttachmentGroupPropsWithContext<StreamChatClient>,
  nextProps: FileAttachmentGroupPropsWithContext<StreamChatClient>,
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
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = Partial<Omit<FileAttachmentGroupPropsWithContext<StreamChatClient>, 'messageId'>> &
  Pick<FileAttachmentGroupPropsWithContext<StreamChatClient>, 'messageId'>;

export const FileAttachmentGroup = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  props: FileAttachmentGroupProps<StreamChatClient>,
) => {
  const { files: propFiles, messageId } = props;

  const { files: contextFiles } = useMessageContext<StreamChatClient>();

  const { Attachment = AttachmentDefault } = useMessagesContext<StreamChatClient>();

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
