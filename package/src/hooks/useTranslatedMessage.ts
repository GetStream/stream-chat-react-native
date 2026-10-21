import type { LocalMessage, MessageResponse } from 'stream-chat';

import { useTranslationContext } from '../contexts/translationContext/TranslationContext';

/**
 * The key under which auto-translated text lives in `message.i18n`. The UI language can be any
 * registered string, while `message.i18n` only carries the languages the auto-translation endpoint
 * supports: the `in` check below makes an unsupported language fall through to the original text.
 */
type TranslationKey = `${string}_text`;

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
  const translationKey: TranslationKey = `${userLanguage}_text`;

  if (!message) {
    return undefined;
  }

  if (message.i18n && translationKey in message.i18n && message.type !== 'deleted') {
    return {
      ...message,
      text: message.i18n[translationKey],
    };
  }

  return { ...message };
};

export const useTranslatedMessage = (message?: LocalMessage | MessageResponse) => {
  const { userLanguage } = useTranslationContext();

  return getTranslatedMessage(message, userLanguage);
};
