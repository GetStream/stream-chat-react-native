import type { FormatMessageResponse, MessageResponse, TranslationLanguages } from 'stream-chat';

import { useMessageOverlayContext } from '../contexts/messageOverlayContext/MessageOverlayContext';
import { useTranslationContext } from '../contexts/translationContext/TranslationContext';
import type { DefaultStreamChatGenerics } from '../types/types';

type TranslationKey = `${TranslationLanguages}_text`;

export const useTranslatedMessage = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  message: MessageResponse<StreamChatGenerics> | FormatMessageResponse<StreamChatGenerics>,
) => {
  const { userLanguage: translationContextUserLanguage } = useTranslationContext();
  const messageOverlayContextValue = useMessageOverlayContext<StreamChatGenerics>();

  const userLanguage =
    messageOverlayContextValue.data?.userLanguage || translationContextUserLanguage;

  const translationKey: TranslationKey = `${userLanguage}_text`;

  if (message.i18n && translationKey in message.i18n) {
    return {
      ...message,
      text: message.i18n[translationKey],
    };
  }

  return { ...message };
};
