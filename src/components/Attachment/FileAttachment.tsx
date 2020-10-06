import React from 'react';
import { Linking, TouchableOpacity } from 'react-native';

import {
  AttachmentActionsProps,
  AttachmentActions as DefaultAttachmentActions,
} from './AttachmentActions';

import { useMessageContentContext } from '../../contexts/messageContentContext/MessageContentContext';
import { styled } from '../../styles/styledComponents';

import type { Attachment } from 'stream-chat';

import type { ActionHandler } from './Attachment';
import { FileIcon as DefaultFileIcon } from './FileIcon';
import type { FileIconProps } from './FileIcon';

import type {
  Alignment,
  GroupType,
} from '../../contexts/messagesContext/MessagesContext';
import type { DefaultAttachmentType, UnknownType } from '../../types/types';

const FileContainer = styled.View<{
  alignment: Alignment;
  groupStyle?: string;
}>`
  align-items: center;
  background-color: #ebebeb;
  border-bottom-left-radius: ${({ alignment, groupStyle }) => {
    if (groupStyle === 'top' || groupStyle === 'middle') return 0;
    return alignment === 'right' ? 16 : 2;
  }}px;
  border-bottom-right-radius: ${({ alignment, groupStyle }) => {
    if (groupStyle === 'top' || groupStyle === 'middle') return 0;
    return alignment === 'left' ? 16 : 2;
  }}px;
  border-top-left-radius: ${({ groupStyle }) => {
    if (groupStyle === 'middle' || groupStyle === 'bottom') return 0;
    return 16;
  }}px;
  border-top-right-radius: ${({ groupStyle }) => {
    if (groupStyle === 'middle' || groupStyle === 'bottom') return 0;
    return 16;
  }}px;
  flex-direction: row;
  padding: 10px;
  ${({ theme }) => theme.message.file.container.css}
`;

const FileDetails = styled.View`
  padding-left: 10px;
  ${({ theme }) => theme.message.file.details.css}
`;

const FileSize = styled.Text`
  ${({ theme }) => theme.message.file.size.css}
`;

const FileTitle = styled.Text`
  font-weight: 700;
  ${({ theme }) => theme.message.file.title.css}
`;

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
      console.log("Don't know how to open URI: " + url);
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

  const { additionalTouchableProps, onLongPress } = useMessageContentContext();

  return (
    <TouchableOpacity
      onLongPress={onLongPress}
      onPress={() => goToURL(attachment.asset_url)}
      testID='file-attachment'
      {...additionalTouchableProps}
    >
      <FileContainer alignment={alignment} groupStyle={groupStyle}>
        <AttachmentFileIcon mimeType={attachment.mime_type} />
        <FileDetails>
          <FileTitle numberOfLines={2}>{attachment.title}</FileTitle>
          <FileSize>{getFileSizeDisplayText(attachment.file_size)}</FileSize>
        </FileDetails>
      </FileContainer>
      {attachment.actions?.length ? (
        <AttachmentActions<At> actionHandler={actionHandler} {...attachment} />
      ) : null}
    </TouchableOpacity>
  );
};
