import React from 'react';
import type { Attachment as AttachmentType, UnknownType } from 'stream-chat';

import Attachment, { ActionHandler } from './Attachment';

import { styled } from '../../styles/styledComponents';

import type { AttachmentActionsProps } from './AttachmentActions';
import type { FileAttachmentProps } from './FileAttachment';
import type { FileIconProps } from './FileIcon';
import type {
  Alignment,
  GroupType,
} from '../../contexts/messagesContext/MessagesContext';
import type { DefaultAttachmentType } from '../../types/types';

const Container = styled.View`
  align-items: stretch;
`;

export type FileAttachmentGroupProps<
  At extends UnknownType = DefaultAttachmentType
> = {
  /**
   * Position of the message, either 'right' or 'left'
   */
  alignment: Alignment;
  /**
   * The files attached to a message
   */
  files: AttachmentType<At>[];
  /**
   * Handler for actions. Actions in combination with attachments can be used to build [commands](https://getstream.io/chat/docs/#channel_commands).
   */
  handleAction: ActionHandler;
  /**
   * Custom UI component to display attachment actions. e.g., send, shuffle, cancel in case of giphy
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/AttachmentActions.js
   */
  AttachmentActions?: React.ComponentType<Partial<AttachmentActionsProps<At>>>;
  /**
   * Custom UI component for attachment icon for type 'file' attachment.
   * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileIcon.js
   */
  AttachmentFileIcon?: React.ComponentType<Partial<FileIconProps>>;
  /**
   * Custom UI component to display File type attachment.
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileAttachment.js
   */
  FileAttachment?: React.ComponentType<FileAttachmentProps<At>>;
  /**
   * The unique id for the message with file attachments
   */
  messageId?: string;
};

const FileAttachmentGroup = <At extends UnknownType = DefaultAttachmentType>(
  props: FileAttachmentGroupProps<At>,
) => {
  const {
    alignment,
    AttachmentActions,
    AttachmentFileIcon,
    FileAttachment,
    files,
    handleAction,
    messageId,
  } = props;

  return (
    <Container>
      {files.length &&
        files.map((file, index) => {
          let groupStyle: GroupType = 'single';

          if (files.length === 1) {
            groupStyle = 'single';
          } else if (index === 0) {
            groupStyle = 'top';
          } else if (index < files.length - 1 && index > 0) {
            groupStyle = 'middle';
          } else if (index === files.length - 1) {
            groupStyle = 'bottom';
          }

          return (
            <Attachment<At>
              actionHandler={handleAction}
              alignment={alignment}
              attachment={file}
              AttachmentActions={AttachmentActions}
              AttachmentFileIcon={AttachmentFileIcon}
              FileAttachment={FileAttachment}
              groupStyle={groupStyle}
              key={`${messageId}-${index}`}
            />
          );
        })}
    </Container>
  );
};

export default FileAttachmentGroup;
