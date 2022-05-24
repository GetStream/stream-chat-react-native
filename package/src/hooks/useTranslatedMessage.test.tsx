import type { TranslationLanguages } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../types/types';
import { useTranslationContext } from '../contexts/translationContext/TranslationContext';
import type { MessageType } from '../components/MessageList/hooks/useMessageList';

//todo: This has to be changed in the future and is
// depending on a change in the js client
// stream-chat/src/types.ts:491
type I18nTextKey = `${TranslationLanguages}_text`;

export const useTranslatedMessage = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  message: MessageType<StreamChatGenerics>,
) => {
  const { userLanguage } = useTranslationContext();

  if (message.i18n !== undefined) {
    const i18nTextKey = `${userLanguage}_text` as I18nTextKey;
    const translationExistsInUserLanguage = i18nTextKey in message.i18n;
    return translationExistsInUserLanguage && message.i18n[i18nTextKey];
  }

  return message.text;
};
