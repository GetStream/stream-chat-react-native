import { useMemo } from 'react';

import {
  Attachment,
  isImageAttachment,
  isAudioAttachment,
  isGiphyAttachment,
  isVideoAttachment,
  isFileAttachment,
  isVoiceRecordingAttachment,
} from 'stream-chat';

type GroupedAttachments = {
  giphys: Attachment[];
  audios: Attachment[];
  images: Attachment[];
  videos: Attachment[];
  files: Attachment[];
  voiceRecordings: Attachment[];
};

/**
 * Hook to group attachments by type.
 * @param {Attachment[]} attachments
 * @returns {GroupedAttachments}
 */
export const useGroupedAttachments = (attachments?: Attachment[]) => {
  return useMemo<GroupedAttachments>(() => {
    if (!attachments?.length) {
      return {
        giphys: [],
        audios: [],
        images: [],
        videos: [],
        files: [],
        voiceRecordings: [],
      };
    }

    return attachments.reduce<GroupedAttachments>(
      (acc, attachment) => {
        if (isGiphyAttachment(attachment)) {
          acc.giphys.push(attachment);
        } else if (isVoiceRecordingAttachment(attachment)) {
          acc.voiceRecordings.push(attachment);
        } else if (isAudioAttachment(attachment)) {
          acc.audios.push(attachment);
        } else if (isImageAttachment(attachment)) {
          acc.images.push(attachment);
        } else if (isVideoAttachment(attachment)) {
          acc.videos.push(attachment);
        } else if (isFileAttachment(attachment)) {
          acc.files.push(attachment);
        }

        return acc;
      },
      {
        giphys: [],
        audios: [],
        images: [],
        videos: [],
        files: [],
        voiceRecordings: [],
      },
    );
  }, [attachments]);
};
