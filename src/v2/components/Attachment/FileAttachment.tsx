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

import type { Attachment } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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

export type FileAttachmentPropsWithContext<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'onLongPress'> &
  Pick<
    MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    'additionalTouchableProps' | 'AttachmentActions' | 'AttachmentFileIcon'
  > & {
    /** The attachment to render */
    attachment: Attachment<At>;
    attachmentSize?: number;
    styles?: Partial<{
      container: StyleProp<ViewStyle>;
      details: StyleProp<ViewStyle>;
      size: StyleProp<TextStyle>;
      title: StyleProp<TextStyle>;
    }>;
  };

const FileAttachmentWithContext = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: FileAttachmentPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    additionalTouchableProps,
    attachment,
    attachmentSize,
    AttachmentActions,
    AttachmentFileIcon,
    onLongPress,
    styles: stylesProp = {},
  } = props;

  const {
    theme: {
      messageSimple: {
        file: { container, details, fileSize, title },
      },
    },
  } = useTheme();

  return (
    <TouchableOpacity
      onLongPress={onLongPress}
      onPress={() => goToURL(attachment.asset_url)}
      testID='file-attachment'
      {...additionalTouchableProps}
    >
      <View style={[styles.container, container, stylesProp.container]}>
        <AttachmentFileIcon
          mimeType={attachment.mime_type}
          size={attachmentSize}
        />
        <View style={[styles.details, details, stylesProp.details]}>
          <Text
            numberOfLines={2}
            style={[styles.title, title, stylesProp.title]}
          >
            {attachment.title}
          </Text>
          <Text style={[styles.size, fileSize, stylesProp.size]}>
            {getFileSizeDisplayText(attachment.file_size)}
          </Text>
        </View>
      </View>
      {attachment.actions?.length ? (
        <AttachmentActions {...attachment} />
      ) : null}
    </TouchableOpacity>
  );
};

export type FileAttachmentProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Partial<
  Omit<FileAttachmentPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>, 'attachment'>
> &
  Pick<
    FileAttachmentPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
    'attachment'
  >;

export const FileAttachment = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: FileAttachmentProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { onLongPress } = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    additionalTouchableProps,
    AttachmentActions = AttachmentActionsDefault,
    AttachmentFileIcon = FileIconDefault,
  } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();

  return (
    <FileAttachmentWithContext
      {...{
        additionalTouchableProps,
        AttachmentActions,
        AttachmentFileIcon,
        onLongPress,
      }}
      {...props}
    />
  );
};

FileAttachment.displayName = 'FileAttachment{messageSimple{file}}';
