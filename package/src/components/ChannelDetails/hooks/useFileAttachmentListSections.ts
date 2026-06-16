import { useMemo } from 'react';

import {
  type Attachment,
  isAudioAttachment,
  isFileAttachment,
  isScrapedContent,
  type MessageResponse,
} from 'stream-chat';

import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { getDateString } from '../../../utils/i18n/getDateString';

/**
 * A single file/audio attachment paired with the message it belongs to. The file attachment list
 * renders one row per attachment, so a message with multiple file attachments yields multiple rows.
 *
 * @experimental This type is experimental and is subject to change.
 */
export type FileAttachmentTile = { attachment: Attachment; message: MessageResponse };

export type FileAttachmentSection = { data: FileAttachmentTile[]; title: string };

/**
 * Gathers the file/audio attachments from a message, excluding scraped/OG link-preview content.
 */
const getFileAttachments = (message: MessageResponse): Attachment[] =>
  (message.attachments ?? []).filter(
    (attachment) =>
      // We provide mime_type here to avoid attachments with mime_type being categorized as file
      (isFileAttachment(attachment, attachment?.mime_type ? [attachment.mime_type] : []) ||
        isAudioAttachment(attachment)) &&
      !isScrapedContent(attachment),
  );

/**
 * Gathers and filters the file/audio attachments from a list of messages, then groups them into
 * newest-first month sections for the file attachment list. Each section's `data` is a flat list
 * of `{ attachment, message }` tiles; messages without renderable file attachments are skipped.
 *
 * The month label is produced through the shared `getDateString` + translation-key
 * pipeline used by message timestamps (see `useUserActivityStatus`), so the format
 * follows the configured locale and can be customized via the
 * `timestamp/FileAttachmentListSection` translation key.
 * @experimental This hook is experimental and is subject to change.
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
        date: message.created_at as string | Date | undefined,
        t,
        tDateTimeParser,
        timestampTranslationKey: 'timestamp/FileAttachmentListSection',
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
