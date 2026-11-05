import { useCallback } from 'react';

import type { TranslatedField } from 'stream-chat';

import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { getTranslatedText } from '../../../utils/i18n/getTranslatedText';

/**
 * Returns `translate(original, i18n)`, which resolves a poll text (question, option or answer)
 * into the current user's language. Falls back to `original` when there is no translation for it,
 * the same way auto-translated message text does.
 */
export const usePollTextTranslation = () => {
  const { userLanguage } = useTranslationContext();

  return useCallback(
    (original: string, i18n: TranslatedField | undefined): string =>
      getTranslatedText(i18n, userLanguage) ?? original,
    [userLanguage],
  );
};
