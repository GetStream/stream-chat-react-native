import { useEffect, useState } from 'react';
import Immutable from 'seamless-immutable';

import { generateRandomId } from '../utils/generateRandomId';

export const useMessageDetailsForState = (message, initialValue) => {
  const [fileUploads, setFileUploads] = useState(Immutable([]));
  const [imageUploads, setImageUploads] = useState(Immutable([]));
  const [mentionedUsers, setMentionedUsers] = useState(
    message && message.mentioned_users ? [...message.mentioned_users] : [],
  );
  const [numberOfUploads, setNumberOfUploads] = useState(0);
  const [text, setText] = useState(initialValue || '');

  useEffect(() => {
    if (message) {
      setText(message.text);
      const newFileUploads = [];
      const newImageUploads = [];

      for (const attach of message.attachments) {
        if (attach.type === 'file') {
          const id = generateRandomId();
          newFileUploads.push({
            file: {
              name: attach.title,
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
