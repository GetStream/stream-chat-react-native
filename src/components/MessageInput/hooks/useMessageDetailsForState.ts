import { useEffect, useState } from 'react';

import { generateRandomId } from '../utils/generateRandomId';

import {
  isEditingBoolean,
  MessagesContextValue,
} from '../../../contexts/messagesContext/MessagesContext';

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

export type FileUpload = {
  file: {
    name: string;
    size?: number | string;
    type?: string;
    uri?: string;
  };
  id: string;
  state: string;
  url?: string;
};

export type ImageUpload = {
  file: {
    name?: string;
    uri?: string;
  };
  id: string;
  state: string;
  url?: string;
};

export const useMessageDetailsForState = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  message: MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>['editing'],
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
  const [text, setText] = useState(initialValue || '');

  useEffect(() => {
    if (message && !isEditingBoolean<At, Ch, Co, Ev, Me, Re, Us>(message)) {
      setText(message?.text || '');
      const newFileUploads = [];
      const newImageUploads = [];

      const attachments = Array.isArray(message.attachments)
        ? message.attachments
        : [];

      for (const attach of attachments) {
        if (attach.type === 'file') {
          const id = generateRandomId();
          newFileUploads.push({
            file: {
              name: attach.title || '',
              size: attach.file_size,
              type: attach.mime_type,
            },
            id,
            state: 'finished',
            url: attach.asset_url,
          });
        } else if (attach.type === 'image') {
          const id = generateRandomId();
          newImageUploads.push({
            file: { name: attach.fallback },
            id,
            state: 'finished',
            url: attach.image_url,
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
  }, [message]);

  return {
    fileUploads,
    imageUploads,
    mentionedUsers,
    numberOfUploads,
    setFileUploads,
    setImageUploads,
    setMentionedUsers,
    setNumberOfUploads,
    setText,
    text,
  };
};
