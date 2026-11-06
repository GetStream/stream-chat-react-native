/**
 * Returns the translation of a text into `language`, or undefined if there is none.
 *
 * The UI language can be any registered string, while `i18n` only carries the languages the
 * auto-translation endpoint supports, so an unsupported language returns undefined.
 */
export const getTranslatedText = (
  i18n: Record<string, string> | undefined,
  language: string,
): string | undefined => i18n?.[`${language}_text`];
