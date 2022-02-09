import React from 'react';
import {
  Linking,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import type { Attachment } from 'stream-chat';

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
import type { DefaultStreamChatGenerics } from '../../types/types';
import { vw } from '../../utils/utils';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    padding: 8,
  },
  details: {
    maxWidth: vw(60),
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

export type FileAttachmentPropsWithContext<
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  MessageContextValue<StreamChatClient>,
  'onLongPress' | 'onPress' | 'onPressIn' | 'preventPress'
> &
  Pick<
    MessagesContextValue<StreamChatClient>,
    'additionalTouchableProps' | 'AttachmentActions' | 'FileAttachmentIcon'
  > & {
    /** The attachment to render */
    attachment: Attachment<StreamChatClient>;
    attachmentSize?: number;
    styles?: Partial<{
      container: StyleProp<ViewStyle>;
      details: StyleProp<ViewStyle>;
      size: StyleProp<TextStyle>;
      title: StyleProp<TextStyle>;
    }>;
  };

const FileAttachmentWithContext = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: FileAttachmentPropsWithContext<StreamChatClient>,
) => {
  const {
    additionalTouchableProps,
    attachment,
    attachmentSize,
    AttachmentActions,
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

  const defaultOnPress = () => goToURL(attachment.asset_url);

  return (
    <TouchableOpacity
      disabled={preventPress}
      onLongPress={(event) => {
        if (onLongPress) {
          onLongPress({
            emitter: 'fileAttachment',
            event,
          });
        }
      }}
      onPress={(event) => {
        if (onPress) {
          onPress({
            defaultHandler: defaultOnPress,
            emitter: 'fileAttachment',
            event,
          });
        }
      }}
      onPressIn={(event) => {
        if (onPressIn) {
          onPressIn({
            defaultHandler: defaultOnPress,
            emitter: 'fileAttachment',
            event,
          });
        }
      }}
      testID='file-attachment'
      {...additionalTouchableProps}
    >
      <View style={[styles.container, { backgroundColor: white }, container, stylesProp.container]}>
        <FileAttachmentIcon mimeType={attachment.mime_type} size={attachmentSize} />
        <View style={[styles.details, details, stylesProp.details]}>
          <Text numberOfLines={2} style={[styles.title, { color: black }, title, stylesProp.title]}>
            {attachment.title}
          </Text>
          <Text style={[styles.size, { color: grey }, fileSize, stylesProp.size]}>
            {getFileSizeDisplayText(attachment.file_size)}
          </Text>
        </View>
      </View>
      {attachment.actions?.length ? <AttachmentActions {...attachment} /> : null}
    </TouchableOpacity>
  );
};

export type FileAttachmentProps<
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<Omit<FileAttachmentPropsWithContext<StreamChatClient>, 'attachment'>> &
  Pick<FileAttachmentPropsWithContext<StreamChatClient>, 'attachment'>;

export const FileAttachment = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: FileAttachmentProps<StreamChatClient>,
) => {
  const { onLongPress, onPress, onPressIn, preventPress } = useMessageContext<StreamChatClient>();
  const {
    additionalTouchableProps,
    AttachmentActions = AttachmentActionsDefault,
    FileAttachmentIcon = FileIconDefault,
  } = useMessagesContext<StreamChatClient>();

  return (
    <FileAttachmentWithContext
      {...{
        additionalTouchableProps,
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
  if (!size) return;
  if (typeof size === 'string') {
    size = parseFloat(size);
  }

  if (size < 1000 * 1000) {
    return `${Math.floor(Math.floor(size / 10) / 100)} KB`;
  }

  return `${Math.floor(Math.floor(size / 10000) / 100)} MB`;
};

export const goToURL = (url?: string) => {
  if (!url) return;
  Linking.canOpenURL(url).then((supported) => {
    if (supported) {
      Linking.openURL(url);
    } else {
      console.log(`Don't know how to open URI: ${url}`);
    }
  });
};

FileAttachment.displayName = 'FileAttachment{messageSimple{file}}';
