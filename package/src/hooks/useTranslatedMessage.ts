import type { FormatMessageResponse, MessageResponse, TranslationLanguages } from 'stream-chat';

import { useTranslationContext } from '../contexts/translationContext/TranslationContext';
import type { DefaultStreamChatGenerics } from '../types/types';

type TranslationKey = `${TranslationLanguages}_text`;

export const useTranslatedMessage = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  message?: MessageResponse<StreamChatGenerics> | FormatMessageResponse<StreamChatGenerics>,
) => {
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
