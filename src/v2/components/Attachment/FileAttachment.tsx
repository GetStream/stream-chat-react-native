import React from 'react';
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  AttachmentActionsProps,
  AttachmentActions as DefaultAttachmentActions,
} from './AttachmentActions';

import { useMessageContentContext } from '../../contexts/messageContentContext/MessageContentContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type { Attachment } from 'stream-chat';

import type { ActionHandler } from './Attachment';
import { FileIcon as DefaultFileIcon } from './FileIcon';
import type { FileIconProps } from './FileIcon';

import type {
  Alignment,
  GroupType,
} from '../../contexts/messagesContext/MessagesContext';
import type { DefaultAttachmentType, UnknownType } from '../../types/types';

const styles = StyleSheet.create({
  fileContainer: {
    alignItems: 'center',
    backgroundColor: '#EBEBEB',
    flexDirection: 'row',
    padding: 10,
  },
  fileDetails: {
    paddingLeft: 10,
  },
  fileTitle: {
    fontWeight: '700',
  },
});

const getFileSizeDisplayText = (size?: number | string) => {
  if (!size) return;
  if (typeof size === 'string') {
    size = parseFloat(size);
  }

  if (size < 1000 * 1000) {
    return `${Math.floor(size / 10) / 100} KB`;
  }

  return `${Math.floor(size / 10000) / 100} MB`;
};

const goToURL = (url?: string) => {
  if (!url) return;
  Linking.canOpenURL(url).then((supported) => {
    if (supported) {
      Linking.openURL(url);
    } else {
      console.log(`Don't know how to open URI: ${url}`);
    }
  });
};

export type FileAttachmentProps<
  At extends UnknownType = DefaultAttachmentType
> = {
  /** The attachment to render */
  attachment: Attachment<At>;
  /** Handler for actions. Actions in combination with attachments can be used to build [commands](https://getstream.io/chat/docs/#channel_commands). */
  actionHandler?: ActionHandler;
  /**
   * Position of the message, either 'right' or 'left'
   */
  alignment?: Alignment;
  /**
   * Custom UI component to display attachment actions. e.g., send, shuffle, cancel in case of giphy
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/AttachmentActions.tsx
   */
  AttachmentActions?: React.ComponentType<AttachmentActionsProps<At>>;
  /**
   * Custom UI component for attachment icon for type 'file' attachment.
   * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/FileIcon.tsx
   */
  AttachmentFileIcon?: React.ComponentType<FileIconProps>;
  /**
   * Position of message in group - top, bottom, middle, single.
   *
   * Message group is a group of consecutive messages from same user. groupStyles can be used to style message as per their position in message group
   * e.g., user avatar (to which message belongs to) is only showed for last (bottom) message in group.
   */
  groupStyle?: GroupType;
};

export const FileAttachment = <
  At extends DefaultAttachmentType = DefaultAttachmentType
>(
  props: FileAttachmentProps<At>,
) => {
  const {
    actionHandler,
    alignment = 'right',
    attachment,
    AttachmentActions = DefaultAttachmentActions,
    AttachmentFileIcon = DefaultFileIcon,
    groupStyle,
  } = props;

  const {
    theme: {
      message: {
        file: { container, details, size, title },
      },
    },
  } = useTheme();

  const { additionalTouchableProps, onLongPress } = useMessageContentContext();

  const borderBottomLeftRadius =
    groupStyle === 'top' || groupStyle === 'middle'
      ? 0
      : alignment === 'right'
      ? 16
      : 2;
  const borderBottomRightRadius =
    groupStyle === 'top' || groupStyle === 'middle'
      ? 0
      : alignment === 'left'
      ? 16
      : 2;
  const borderTopLeftRadius =
    groupStyle === 'bottom' || groupStyle === 'middle' ? 0 : 16;
  const borderTopRightRadius =
    groupStyle === 'bottom' || groupStyle === 'middle' ? 0 : 16;

  return (
    <TouchableOpacity
      onLongPress={onLongPress}
      onPress={() => goToURL(attachment.asset_url)}
      testID='file-attachment'
      {...additionalTouchableProps}
    >
      <View
        style={[
          styles.fileContainer,
          {
            borderBottomLeftRadius,
            borderBottomRightRadius,
            borderTopLeftRadius,
            borderTopRightRadius,
          },
          container,
        ]}
      >
        <AttachmentFileIcon mimeType={attachment.mime_type} />
        <View style={[styles.fileDetails, details]}>
          <Text numberOfLines={2} style={[styles.fileTitle, title]}>
            {attachment.title}
          </Text>
          <Text style={size}>
            {getFileSizeDisplayText(attachment.file_size)}
          </Text>
        </View>
      </View>
      {attachment.actions?.length ? (
        <AttachmentActions<At> actionHandler={actionHandler} {...attachment} />
      ) : null}
    </TouchableOpacity>
  );
};

FileAttachment.displayName = 'FileAttachment{message{file}}';
