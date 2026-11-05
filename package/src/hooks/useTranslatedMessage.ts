import type { LocalMessage, MessageResponse } from 'stream-chat';

import { useTranslationContext } from '../contexts/translationContext/TranslationContext';
import { getTranslatedText } from '../utils/i18n/getTranslatedText';

/**
 * Returns a copy of `message` with its text swapped for the auto-translation into `userLanguage`,
 * when there is one. Deleted messages keep their text.
 *
 * @param message The message to translate.
 * @param userLanguage The language to translate into.
 * @returns The message copy, or `undefined` without a message.
 */
export const getTranslatedMessage = (
  message: LocalMessage | MessageResponse | undefined,
  userLanguage: string,
) => {
  if (!message) {
    return undefined;
  }

  const translatedText =
    message.type !== 'deleted' ? getTranslatedText(message.i18n, userLanguage) : undefined;

  if (translatedText !== undefined) {
    return {
      ...message,
      text: translatedText,
    };
  }

  return { ...message };
};

export const useTranslatedMessage = (message?: LocalMessage | MessageResponse) => {
  const { userLanguage } = useTranslationContext();

  return getTranslatedMessage(message, userLanguage);
};
