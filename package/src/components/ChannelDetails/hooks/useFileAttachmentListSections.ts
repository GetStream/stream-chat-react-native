import { useMemo } from 'react';

import {
  convertTimestampToDate,
  isAudioAttachment,
  isFileAttachment,
  isScrapedContent,
  type Attachment,
  type MessageResponse,
} from 'stream-chat';

import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { getDateString } from '../../../i18n/utils';

/**
 * A file or audio attachment with its message. A message with several file attachments yields one
 * tile per attachment.
 */
export type FileAttachmentTile = { attachment: Attachment; message: MessageResponse };

export type FileAttachmentSection = { data: FileAttachmentTile[]; title: string };

// File and audio attachments of a message, excluding scraped link previews.
const getFileAttachments = (message: MessageResponse): Attachment[] =>
  (message.attachments ?? []).filter(
    (attachment) =>
      // The attachment's own `mime_type` is passed as a supported video format so that attachments
      // carrying one are not classified as files.
      (isFileAttachment(
        attachment,
        attachment?.custom?.mime_type ? [attachment.custom.mime_type] : [],
      ) ||
        isAudioAttachment(attachment)) &&
      !isScrapedContent(attachment),
  );

/**
 * Groups the file and audio attachments of the messages into month sections, in message order.
 * Messages without file attachments are skipped. The month title follows the configured locale and
 * can be customized through the `timestamp.FileAttachmentListSection` translation key.
 *
 * @param messages The messages to gather attachments from.
 * @returns The sections, each with a title and its `{ attachment, message }` tiles.
 */
export const useFileAttachmentListSections = (
  messages?: MessageResponse[],
): FileAttachmentSection[] => {
  const { t, tDateTimeParser } = useTranslationContext();

  return useMemo<FileAttachmentSection[]>(() => {
    if (!messages || messages.length === 0) {
      return [];
    }
    const result: FileAttachmentSection[] = [];
    for (const message of messages) {
      const fileAttachments = getFileAttachments(message);
      if (fileAttachments.length === 0) {
        continue;
      }
      const formatted = getDateString({
        messageCreatedAt: convertTimestampToDate(message.created_at),
        t,
        tDateTimeParser,
        timestampTranslationKey: 'timestamp.FileAttachmentListSection',
      });
      const title = typeof formatted === 'string' ? formatted : String(formatted ?? '');
      const tiles = fileAttachments.map((attachment) => ({ attachment, message }));
      const lastSection = result[result.length - 1];
      if (lastSection && lastSection.title === title) {
        lastSection.data.push(...tiles);
      } else {
        result.push({ data: tiles, title });
      }
    }
    return result;
  }, [messages, t, tDateTimeParser]);
};
