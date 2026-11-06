import { useContext, useMemo } from 'react';

import { TranslationContext } from '../../contexts/translationContext/TranslationContext';
import { defaultTranslatorFunction } from '../../utils/i18n/utils';

// The chat SDK's own provider, for apps that use the AI components without `<Chat>`.
export {
  TranslationProvider,
  type TranslationContextValue,
} from '../../contexts/translationContext/TranslationContext';

/**
 * Translates one of the AI components' strings. The key is the English string itself, with
 * `{{ name }}` placeholders filled from `options`, as in the chat SDK's i18n files.
 */
export type AITranslate = (key: string, options?: Record<string, unknown>) => string;

const PLACEHOLDER = /{{\s*([\w.]+)\s*}}/g;

/** Fills `{{ name }}` placeholders in `text` from `options`, leaving unknown ones as they are. */
export const interpolateAIString = (text: string, options?: Record<string, unknown>) =>
  options
    ? text.replace(PLACEHOLDER, (placeholder, name: string) =>
        options[name] === undefined || options[name] === null ? placeholder : String(options[name]),
      )
    : text;

/** English: the key itself, with its placeholders filled. */
export const defaultAITranslate: AITranslate = (key, options) => interpolateAIString(key, options);

/**
 * The chat SDK's translator, so the AI components follow the chat's language inside `<Chat>`. With
 * no translator set up (no `<Chat>`, or before it has one) they are in English.
 */
export const useAITranslation = () => {
  const { t } = useContext(TranslationContext);
  return useMemo(
    () => ({ t: t === defaultTranslatorFunction ? defaultAITranslate : (t as AITranslate) }),
    [t],
  );
};
