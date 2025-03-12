import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import type { Attachment } from 'stream-chat';

import { openUrlSafely } from './utils/openUrlSafely';

import { AttachmentActions as AttachmentActionsDefault } from '../../components/Attachment/AttachmentActions';
import { FileIcon as FileIconDefault } from '../../components/Attachment/FileIcon';
import {
  MessageContextValue,
  useMessageContext,
} from '../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useViewport } from '../../hooks/useViewport';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    padding: 8,
  },
  details: {
    paddingLeft: 16,
  },
  size: {
    fontSize: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export type FileAttachmentPropsWithContext = Pick<
  MessageContextValue,
  'onLongPress' | 'onPress' | 'onPressIn' | 'preventPress'
> &
  Pick<
    MessagesContextValue,
    'additionalPressableProps' | 'AttachmentActions' | 'FileAttachmentIcon'
  > & {
    /** The attachment to render */
    attachment: Attachment;
    attachmentSize?: number;
    styles?: Partial<{
      container: StyleProp<ViewStyle>;
      details: StyleProp<ViewStyle>;
      size: StyleProp<TextStyle>;
      title: StyleProp<TextStyle>;
    }>;
  };

const FileAttachmentWithContext = (props: FileAttachmentPropsWithContext) => {
  const {
    additionalPressableProps,
    attachment,
    AttachmentActions,
    attachmentSize,
    FileAttachmentIcon,
    onLongPress,
    onPress,
    onPressIn,
    preventPress,
    styles: stylesProp = {},
  } = props;

  const {
    theme: {
      colors: { black, grey, white },
      messageSimple: {
        file: { container, details, fileSize, title },
      },
    },
  } = useTheme();
  const { vw } = useViewport();

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
      <View style={[styles.container, { backgroundColor: white }, container, stylesProp.container]}>
        <FileAttachmentIcon mimeType={attachment.mime_type} size={attachmentSize} />
        <View
          style={[
            styles.details,
            {
              maxWidth: vw(60),
            },
            details,
            stylesProp.details,
          ]}
        >
          <Text numberOfLines={2} style={[styles.title, { color: black }, title, stylesProp.title]}>
            {attachment.title}
          </Text>
          <Text style={[styles.size, { color: grey }, fileSize, stylesProp.size]}>
            {getFileSizeDisplayText(attachment.file_size)}
          </Text>
        </View>
      </View>
      {attachment.actions?.length ? <AttachmentActions {...attachment} /> : null}
    </Pressable>
  );
};

export type FileAttachmentProps = Partial<Omit<FileAttachmentPropsWithContext, 'attachment'>> &
  Pick<FileAttachmentPropsWithContext, 'attachment'>;

export const FileAttachment = (props: FileAttachmentProps) => {
  const { onLongPress, onPress, onPressIn, preventPress } = useMessageContext();
  const {
    additionalPressableProps,
    AttachmentActions = AttachmentActionsDefault,
    FileAttachmentIcon = FileIconDefault,
  } = useMessagesContext();

  return (
    <FileAttachmentWithContext
      {...{
        additionalPressableProps,
        AttachmentActions,
        FileAttachmentIcon,
        onLongPress,
        onPress,
        onPressIn,
        preventPress,
      }}
      {...props}
    />
  );
};

export const getFileSizeDisplayText = (size?: number | string) => {
  if (!size) {
    return;
  }
  if (typeof size === 'string') {
    size = parseFloat(size);
  }

  if (size < 1000 * 1000) {
    return `${Math.floor(Math.floor(size / 10) / 100)} KB`;
  }

  return `${Math.floor(Math.floor(size / 10000) / 100)} MB`;
};

FileAttachment.displayName = 'FileAttachment{messageSimple{file}}';
