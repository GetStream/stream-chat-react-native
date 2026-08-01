import type { LocalMessage, MessageResponse, TranslationLanguage } from 'stream-chat';

import { useTranslationContext } from '../contexts/translationContext/TranslationContext';

type TranslationKey = `${TranslationLanguage}_text`;

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
