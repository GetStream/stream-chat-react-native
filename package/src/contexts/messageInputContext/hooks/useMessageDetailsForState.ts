import { useEffect, useState } from 'react';

import { Attachment } from 'stream-chat';

import {
  DefaultStreamChatGenerics,
  FileTypes,
  FileUpload,
  ImageUpload,
} from '../../../types/types';
import { generateRandomId, stringifyMessage } from '../../../utils/utils';

import type { MessageInputContextValue } from '../MessageInputContext';

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

  const mapAttachmentToFileUpload = (attachment: Attachment<StreamChatGenerics>): FileUpload => {
    const id = generateRandomId();

    if (attachment.type === FileTypes.Audio) {
      return {
        file: {
          duration: attachment.duration,
          mimeType: attachment.mime_type,
          name: attachment.title || '',
          size: attachment.file_size,
          uri: attachment.asset_url,
        },
        id,
        state: 'finished',
        url: attachment.asset_url,
      };
    } else if (attachment.type === FileTypes.Video) {
      return {
        file: {
          duration: attachment.duration,
          mimeType: attachment.mime_type,
          name: attachment.title || '',
          size: attachment.file_size,
          uri: attachment.asset_url,
        },
        id,
        state: 'finished',
        thumb_url: attachment.thumb_url,
        url: attachment.asset_url,
      };
    } else if (attachment.type === FileTypes.VoiceRecording) {
      return {
        file: {
          duration: attachment.duration,
          mimeType: attachment.mime_type,
          name: attachment.title || '',
          size: attachment.file_size,
          uri: attachment.asset_url,
          waveform_data: attachment.waveform_data,
        },
        id,
        state: 'finished',
        url: attachment.asset_url,
      };
    } else if (attachment.type === FileTypes.File) {
      return {
        file: {
          mimeType: attachment.mime_type,
          name: attachment.title || '',
          size: attachment.file_size,
          uri: attachment.asset_url,
        },
        id,
        state: 'finished',
        url: attachment.asset_url,
      };
    } else {
      return {
        file: {
          mimeType: attachment.mime_type,
          name: attachment.title || '',
          size: attachment.file_size,
          uri: attachment.asset_url,
        },
        id,
        state: 'finished',
        url: attachment.asset_url,
      };
    }
  };

  useEffect(() => {
    if (message) {
      setText(message?.text || '');
      const newFileUploads: FileUpload[] = [];
      const newImageUploads: ImageUpload[] = [];

      const attachments = Array.isArray(message.attachments) ? message.attachments : [];

      for (const attachment of attachments) {
        if (attachment.type === FileTypes.Image) {
          const id = generateRandomId();
          newImageUploads.push({
            file: {
              height: attachment.original_height,
              name: attachment.fallback,
              size: attachment.file_size,
              type: attachment.type,
              width: attachment.original_width,
            },
            id,
            state: 'finished',
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
