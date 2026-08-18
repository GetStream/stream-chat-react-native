import type { DynamicTranslationKey } from './types';

/**
 * Brand a runtime-resolved string as a translation key.
 *
 * {@link DynamicTranslationKey} is deliberately branded, so a plain `string` is not assignable to
 * the dynamic overload of `StreamTFunction`. Taking the escape hatch therefore has to be
 * explicit — and every site that does is greppable by this function's name.
 *
 * @example t(asDynamicKey(command.description))
 */
export const asDynamicKey = (key: string) => key as DynamicTranslationKey;
