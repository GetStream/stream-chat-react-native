import type { TranslatedField, TranslationLanguages } from 'stream-chat';

/**
 * Returns the translation of a text into `language`, or undefined if there is none.
 */
export const getTranslatedText = (
  i18n: TranslatedField | undefined,
  language: TranslationLanguages,
): string | undefined => i18n?.[`${language}_text` as `${TranslationLanguages}_text`];
