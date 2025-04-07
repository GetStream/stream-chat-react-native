import { useEffect, useState } from 'react';

import { Attachment } from 'stream-chat';

import { FileTypes, FileUpload } from '../../../types/types';
import { generateRandomId, getFileTypeFromMimeType, stringifyMessage } from '../../../utils/utils';

import type { MessageInputContextValue } from '../MessageInputContext';

export const useMessageDetailsForState = (
  message: MessageInputContextValue['editing'],
  initialValue?: string,
) => {
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [imageUploads, setImageUploads] = useState<FileUpload[]>([]);
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);
  const [numberOfUploads, setNumberOfUploads] = useState(0);
  const [showMoreOptions, setShowMoreOptions] = useState(true);

  const initialTextValue = initialValue || '';
  const [text, setText] = useState(initialTextValue);

  useEffect(() => {
    if (text !== initialTextValue) {
      setShowMoreOptions(false);
    }
    if (fileUploads.length || imageUploads.length) {
      setShowMoreOptions(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, imageUploads.length, fileUploads.length]);

  const messageValue = message ? stringifyMessage(message) : '';

  useEffect(() => {
    if (message && Array.isArray(message?.mentioned_users)) {
      const mentionedUsers = message.mentioned_users.map((user) => user.id);
      setMentionedUsers(mentionedUsers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageValue]);

  const mapAttachmentToFileUpload = (attachment: Attachment): FileUpload => {
    const id = generateRandomId();

    if (attachment.type === FileTypes.Audio) {
      return {
        file: {
          duration: attachment.duration || 0,
          name: attachment.title || '',
          size: attachment.file_size || 0,
          type: attachment.mime_type || '',
          uri: attachment.asset_url || '',
        },
        id,
        state: 'finished',
        type: FileTypes.Audio,
        url: attachment.asset_url,
      };
    } else if (attachment.type === FileTypes.Video) {
      return {
        file: {
          duration: attachment.duration || 0,
          name: attachment.title || '',
          size: attachment.file_size || 0,
          thumb_url: attachment.thumb_url || '',
          type: attachment.mime_type || '',
          uri: attachment.asset_url || '',
        },
        id,
        state: 'finished',
        thumb_url: attachment.thumb_url,
        type: FileTypes.Video,
        url: attachment.asset_url,
      };
    } else if (attachment.type === FileTypes.VoiceRecording) {
      return {
        file: {
          duration: attachment.duration || 0,
          name: attachment.title || '',
          size: attachment.file_size || 0,
          type: attachment.mime_type || '',
          uri: attachment.asset_url || '',
          waveform_data: attachment.waveform_data,
        },
        id,
        state: 'finished',
        type: FileTypes.VoiceRecording,
        url: attachment.asset_url,
      };
    } else {
      return {
        file: {
          name: attachment.title || '',
          size: attachment.file_size || 0,
          type: attachment.mime_type || '',
          uri: attachment.asset_url || '',
        },
        id,
        state: 'finished',
        type: getFileTypeFromMimeType(attachment.mime_type || ''),
        url: attachment.asset_url,
      };
    }
  };

  useEffect(() => {
    if (message) {
      setText(message?.text || '');
      const newFileUploads: FileUpload[] = [];
      const newImageUploads: FileUpload[] = [];

      const attachments = Array.isArray(message.attachments) ? message.attachments : [];

      for (const attachment of attachments) {
        if (attachment.type === FileTypes.Image) {
          const id = generateRandomId();
          newImageUploads.push({
            file: {
              height: attachment.original_height || 0,
              name: attachment.fallback || '',
              size: attachment.file_size || 0,
              type: attachment.type || '',
              uri: attachment.image_url || '',
              width: attachment.original_width || 0,
            },
            id,
            state: 'finished',
            type: FileTypes.Image,
            url: attachment.image_url || attachment.asset_url || attachment.thumb_url,
          });
        } else {
          const fileUpload = mapAttachmentToFileUpload(attachment);
          if (fileUpload) {
            newFileUploads.push(fileUpload);
          }
        }
      }
      if (newFileUploads.length) {
        setFileUploads(newFileUploads);
      }
      if (newImageUploads.length) {
        setImageUploads(newImageUploads);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
