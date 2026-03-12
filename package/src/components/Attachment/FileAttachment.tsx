import React, { useMemo } from 'react';
import { Pressable, StyleProp, StyleSheet, TextStyle, ViewStyle } from 'react-native';

import type { Attachment } from 'stream-chat';

import { openUrlSafely } from './utils/openUrlSafely';

import { FileIconProps } from '../../components/Attachment/FileIcon';

import {
  MessageContextValue,
  useMessageContext,
} from '../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

export type FileAttachmentPropsWithContext = Pick<
  MessageContextValue,
  'onLongPress' | 'onPress' | 'onPressIn' | 'preventPress'
> &
  Pick<MessagesContextValue, 'additionalPressableProps' | 'FilePreview'> & {
    /** The attachment to render */
    attachment: Attachment;
    attachmentIconSize?: FileIconProps['size'];
    // TODO: Think we really need a way to style the file preview using props if we have theme.
    styles?: Partial<{
      container: StyleProp<ViewStyle>;
      details: StyleProp<ViewStyle>;
      size: StyleProp<TextStyle>;
      title: StyleProp<TextStyle>;
    }>;
  };

const FileAttachmentWithContext = (props: FileAttachmentPropsWithContext) => {
  const styles = useStyles();

  const {
    additionalPressableProps,
    attachment,
    attachmentIconSize,
    FilePreview,
    onLongPress,
    onPress,
    onPressIn,
    preventPress,
    styles: stylesProp = styles,
  } = props;

  const defaultOnPress = () => openUrlSafely(attachment.asset_url);

  return (
    <Pressable
      disabled={preventPress}
      onLongPress={(event) => {
        if (onLongPress) {
          onLongPress({
            additionalInfo: { attachment },
            emitter: 'fileAttachment',
            event,
          });
        }
      }}
      onPress={(event) => {
        if (onPress) {
          onPress({
            additionalInfo: { attachment },
            defaultHandler: defaultOnPress,
            emitter: 'fileAttachment',
            event,
          });
        }
      }}
      onPressIn={(event) => {
        if (onPressIn) {
          onPressIn({
            additionalInfo: { attachment },
            defaultHandler: defaultOnPress,
            emitter: 'fileAttachment',
            event,
          });
        }
      }}
      testID='file-attachment'
      {...additionalPressableProps}
    >
      <FilePreview
        attachment={attachment}
        attachmentIconSize={attachmentIconSize}
        styles={stylesProp}
      />
    </Pressable>
  );
};

export type FileAttachmentProps = Partial<Omit<FileAttachmentPropsWithContext, 'attachment'>> &
  Pick<FileAttachmentPropsWithContext, 'attachment'>;

export const FileAttachment = (props: FileAttachmentProps) => {
  const { FilePreview: PropFilePreview } = props;
  const { onLongPress, onPress, onPressIn, preventPress } = useMessageContext();
  const { additionalPressableProps, FilePreview: ContextFilePreview } = useMessagesContext();

  const FilePreview = PropFilePreview || ContextFilePreview;

  return (
    <FileAttachmentWithContext
      {...{
        additionalPressableProps,
        FilePreview,
        onLongPress,
        onPress,
        onPressIn,
        preventPress,
      }}
      {...props}
    />
  );
};

FileAttachment.displayName = 'FileAttachment{messageSimple{file}}';

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  const { isMyMessage, messageHasOnlySingleAttachment } = useMessageContext();
  const showBackgroundTransparent = messageHasOnlySingleAttachment;

  return useMemo(() => {
    return StyleSheet.create({
      container: {
        backgroundColor: showBackgroundTransparent
          ? 'transparent'
          : isMyMessage
            ? semantics.chatBgAttachmentOutgoing
            : semantics.chatBgAttachmentIncoming,
      },
    });
  }, [showBackgroundTransparent, isMyMessage, semantics]);
};
