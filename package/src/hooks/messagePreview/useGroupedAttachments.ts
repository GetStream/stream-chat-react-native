import { useMemo } from 'react';

import {
  Attachment,
  isImageAttachment,
  isAudioAttachment,
  isGiphyAttachment,
  isVideoAttachment,
  isFileAttachment,
  isVoiceRecordingAttachment,
  VoiceRecordingAttachment,
} from 'stream-chat';

type GroupedAttachments = {
  giphys: Attachment[];
  audios: Attachment[];
  images: Attachment[];
  videos: Attachment[];
  files: Attachment[];
  // Narrowed by `isVoiceRecordingAttachment` so consumers can read `.custom.duration`.
  voiceRecordings: VoiceRecordingAttachment[];
};

/**
 * Groups attachments by type. Attachments matching no group are dropped.
 *
 * @param attachments The attachments to group.
 * @returns The attachments per type.
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
