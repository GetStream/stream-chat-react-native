import { useMemo } from 'react';

import type { MessageResponse } from 'stream-chat';

import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { getDateString } from '../../../utils/i18n/getDateString';

export type FileAttachmentSection = { data: MessageResponse[]; title: string };

/**
 * Groups file-attachment messages into newest-first month sections for the file
 * attachment list.
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
      const formatted = getDateString({
        date: message.created_at as string | Date | undefined,
        t,
        tDateTimeParser,
        timestampTranslationKey: 'timestamp/FileAttachmentListSection',
      });
      const title = typeof formatted === 'string' ? formatted : String(formatted ?? '');
      const lastSection = result[result.length - 1];
      if (lastSection && lastSection.title === title) {
        lastSection.data.push(message);
      } else {
        result.push({ data: [message], title });
      }
    }
    return result;
  }, [messages, t, tDateTimeParser]);
};
