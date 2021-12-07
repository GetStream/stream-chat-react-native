import { useEffect, useState } from 'react';

import { generateRandomId } from '../../../utils/utils';

import type { FileUpload, ImageUpload, MessageInputContextValue } from '../MessageInputContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

export const isEditingBoolean = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  editing: MessageInputContextValue<At, Ch, Co, Ev, Me, Re, Us>['editing'],
): editing is boolean => typeof editing === 'boolean';

export const useMessageDetailsForState = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  message: MessageInputContextValue<At, Ch, Co, Ev, Me, Re, Us>['editing'],
  initialValue?: string,
) => {
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [imageUploads, setImageUploads] = useState<ImageUpload[]>([]);
  const [mentionedUsers, setMentionedUsers] = useState(
    (!isEditingBoolean<At, Ch, Co, Ev, Me, Re, Us>(message) &&
      Array.isArray(message?.mentioned_users) &&
      message.mentioned_users.map((user) => user.id)) ||
      [],
  );
  const [numberOfUploads, setNumberOfUploads] = useState(0);
  const [showMoreOptions, setShowMoreOptions] = useState(true);
  const initialTextValue = initialValue || '';
  const [text, setText] = useState(initialTextValue);

  useEffect(() => {
    if (text !== initialTextValue) {
      setShowMoreOptions(false);
    }
  }, [text]);

  const messageValue =
    typeof message === 'boolean' ? '' : `${message.id}${message.text}${message.updated_at}`;
  useEffect(() => {
    if (message && !isEditingBoolean<At, Ch, Co, Ev, Me, Re, Us>(message)) {
      setText(message?.text || '');
      const newFileUploads = [];
      const newImageUploads = [];

      const attachments = Array.isArray(message.attachments) ? message.attachments : [];

      for (const attachment of attachments) {
        if (attachment.type === 'file') {
          const id = generateRandomId();
          newFileUploads.push({
            file: {
              name: attachment.title || '',
              size: attachment.file_size,
              type: attachment.mime_type,
            },
            id,
            state: 'finished',
            url: attachment.asset_url,
          });
        } else if (attachment.type === 'image') {
          const id = generateRandomId();
          newImageUploads.push({
            file: {
              name: attachment.fallback,
              size: attachment.file_size,
              type: attachment.type,
            },
            id,
            state: 'finished',
            url: attachment.image_url || attachment.asset_url || attachment.thumb_url,
          });
        }
      }
      if (newFileUploads.length) {
        setFileUploads(newFileUploads);
      }
      if (newImageUploads.length) {
        setImageUploads(newImageUploads);
      }
    }
  }, [messageValue]);

  return {
    fileUploads,
    imageUploads,
    mentionedUsers,
    numberOfUploads,
    setFileUploads,
    setImageUploads,
    setMentionedUsers,
    setNumberOfUploads,
    setShowMoreOptions,
    setText,
    showMoreOptions,
    text,
  };
};
