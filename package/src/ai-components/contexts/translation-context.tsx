import { useContext, useMemo } from 'react';

import {
  TranslationContext,
  type TranslationContextValue,
} from '../../contexts/translationContext/TranslationContext';

// The chat SDK's own provider, for apps that use the AI components without `<Chat>`.
export {
  TranslationProvider,
  type TranslationContextValue,
} from '../../contexts/translationContext/TranslationContext';

/**
 * Translates one of the AI components' strings: the chat SDK's `t`, which takes a catalog key and
 * its English copy, as in `t('aiComponents.replyActions.copy.accessibilityLabel', 'Copy')`.
 */
export type AITranslate = TranslationContextValue['t'];

/**
 * The chat SDK's translator, so the AI components follow the chat's language inside `<Chat>`. With
 * no translator set up (no `<Chat>`, or before it has one) they are in English.
 */
export const useAITranslation = () => {
  const { t, userLanguage } = useContext(TranslationContext);
  return useMemo(() => ({ t, userLanguage: userLanguage ?? 'en' }), [t, userLanguage]);
};
