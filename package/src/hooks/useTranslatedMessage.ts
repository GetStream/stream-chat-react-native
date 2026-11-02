import type { LocalMessage, MessageResponse } from 'stream-chat';

import { useTranslationContext } from '../contexts/translationContext/TranslationContext';
import { getTranslatedText } from '../utils/i18n/getTranslatedText';

export const useTranslatedMessage = (message?: LocalMessage | MessageResponse) => {
  const { userLanguage } = useTranslationContext();

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
