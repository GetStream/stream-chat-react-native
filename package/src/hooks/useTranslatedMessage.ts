import type { LocalMessage, MessageResponse } from 'stream-chat';

import { useTranslationContext } from '../contexts/translationContext/TranslationContext';

/**
 * The key auto-translated text lands under in `message.i18n`.
 *
 * Built from the UI language, which is any string an integrator registered, while `message.i18n`
 * only ever carries the languages the auto-translation endpoint supports. The `in` check below is
 * what reconciles the two: a UI language outside that set simply finds nothing and falls through
 * to the original text, which is the correct behaviour.
 */
type TranslationKey = `${string}_text`;

export const useTranslatedMessage = (message?: LocalMessage | MessageResponse) => {
  const { userLanguage } = useTranslationContext();

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
