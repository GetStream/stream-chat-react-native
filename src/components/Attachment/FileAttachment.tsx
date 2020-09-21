import React, { useContext } from 'react';
import { Linking, TouchableOpacity } from 'react-native';
import type { Attachment, UnknownType } from 'stream-chat';

import { MessageContentContext } from '../../context';
import { styled } from '../../styles/styledComponents';

import type { ActionHandler, GroupStyle } from './Attachment';
import type { AttachmentActionsProps } from './AttachmentActions';
import type { FileIconProps } from './FileIcon';
import type { DefaultAttachmentType } from '../../types/types';

const FileContainer = styled.View<{ alignment: string; groupStyle?: string }>`
  align-items: center;
  background-color: #ebebeb;
  border-radius: ${({ groupStyle }) => {
    if (groupStyle === 'middle' || groupStyle === 'bottom') return 0;
    return 16;
  }}px;
  border-bottom-left-radius: ${({ alignment, groupStyle }) => {
    if (groupStyle === 'top' || groupStyle === 'middle') return 0;
    return alignment === 'right' ? 16 : 2;
  }}px;
  border-bottom-right-radius: ${({ alignment, groupStyle }) => {
    if (groupStyle === 'top' || groupStyle === 'middle') return 0;
    return alignment === 'left' ? 16 : 2;
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
  /** Handler for actions. Actions in combination with attachments can be used to build [commands](https://getstream.io/chat/docs/#channel_commands). */
  actionHandler: ActionHandler;
  /**
   * Position of the message, either 'right' or 'left'
   */
  alignment: 'right' | 'left';
  /** The attachment to render */
  attachment: Attachment<At>;
  /**
   * Custom UI component to display attachment actions. e.g., send, shuffle, cancel in case of giphy
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/AttachmentActions.js
   */
  AttachmentActions: React.ComponentType<Partial<AttachmentActionsProps>>;
  /**
   * Custom UI component for attachment icon for type 'file' attachment.
   * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileIcon.js
   */
  AttachmentFileIcon: React.ComponentType<Partial<FileIconProps>>;
  /**
   * Position of message in group - top, bottom, middle, single.
   *
   * Message group is a group of consecutive messages from same user. groupStyles can be used to style message as per their position in message group
   * e.g., user avatar (to which message belongs to) is only showed for last (bottom) message in group.
   */
  groupStyle?: GroupStyle;
};

const FileAttachment = <
  At extends DefaultAttachmentType = DefaultAttachmentType
>({
  actionHandler,
  alignment,
  attachment,
  AttachmentActions,
  AttachmentFileIcon,
  groupStyle,
}: FileAttachmentProps<At>) => {
  const { additionalTouchableProps, onLongPress } = useContext(
    MessageContentContext,
  );

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
          <FileSize>{attachment.file_size} KB</FileSize>
        </FileDetails>
      </FileContainer>
      {attachment.actions?.length ? (
        <AttachmentActions actionHandler={actionHandler} {...attachment} />
      ) : null}
    </TouchableOpacity>
  );
};

export default FileAttachment;
