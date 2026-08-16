import type { DynamicTranslationKey, StreamTFunction } from './types';

/**
 * Brand a runtime-resolved string as a translation key.
 *
 * {@link DynamicTranslationKey} is deliberately branded, so a plain `string` is not assignable to
 * the dynamic overload of {@link StreamTFunction}. Taking the escape hatch therefore has to be
 * explicit — and every site that does is greppable by this function's name.
 *
 * @example t(asDynamicKey(command.description))
 */
export const asDynamicKey = (key: string) => key as DynamicTranslationKey;

/**
 * The `t` used before `Streami18n` has finished initializing: it echoes the key back.
 *
 * Every prose call site passes its English copy as the second argument, so during that window
 * `t('common.cancel.label', 'Cancel')` still needs to render `Cancel` rather than the key path.
 * Falling back to the key would flash raw dotted paths on first frame.
 */
export const defaultTranslatorFunction = ((
  key: string,
  defaultValueOrOptions?: string | Record<string, unknown>,
) => {
  if (typeof defaultValueOrOptions === 'string') return defaultValueOrOptions;
  return key;
}) as StreamTFunction;
