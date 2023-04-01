import { useEffect, useState } from 'react';

import type { DefaultStreamChatGenerics } from '../../../types/types';
import { generateRandomId } from '../../../utils/utils';

import type { FileUpload, ImageUpload, MessageInputContextValue } from '../MessageInputContext';

export const isEditingBoolean = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  editing: MessageInputContextValue<StreamChatGenerics>['editing'],
): editing is boolean => typeof editing === 'boolean';

export const useMessageDetailsForState = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  message: MessageInputContextValue<StreamChatGenerics>['editing'],
  initialValue?: string,
) => {
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [imageUploads, setImageUploads] = useState<ImageUpload[]>([]);
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);
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
    if (!isEditingBoolean<StreamChatGenerics>(message) && Array.isArray(message?.mentioned_users)) {
      const mentionedUsers = message.mentioned_users.map((user) => user.id);
      setMentionedUsers(mentionedUsers);
    }
  }, [messageValue]);

  useEffect(() => {
    if (message && !isEditingBoolean<StreamChatGenerics>(message)) {
      setText(message?.text || '');
      const newFileUploads: FileUpload[] = [];
      const newImageUploads: ImageUpload[] = [];

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
        } else if (attachment.type === 'video') {
          const id = generateRandomId();
          newFileUploads.push({
            file: {
              name: attachment.title || '',
              size: attachment.file_size,
              type: attachment.mime_type,
            },
            id,
            state: 'finished',
            thumb_url: attachment.thumb_url,
            url: attachment.asset_url,
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
