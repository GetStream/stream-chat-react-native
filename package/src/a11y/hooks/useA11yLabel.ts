import { useContext } from 'react';

import { useAccessibilityContext } from '../../contexts/accessibilityContext/AccessibilityContext';
import { TranslationContext } from '../../contexts/translationContext/TranslationContext';
import { asDynamicKey } from '../../i18n/utils';

/**
 * Returns the translated accessibility label for `key`, or `undefined` when accessibility is
 * disabled, so the i18n lookup is skipped on hot list paths.
 *
 * Example:
 *   const labelParams = useMemo(() => ({ name }), [name]);
 *   const label = useA11yLabel('avatar.accessibilityLabel', labelParams);
 *   <Image accessibilityLabel={label} />
 *
 * @param key Translation key, such as `avatar.accessibilityLabel`.
 * @param params Interpolation values for the translation.
 * @returns The label to pass to `accessibilityLabel`.
 */
export const useA11yLabel = (key: string, params?: Record<string, unknown>): string | undefined => {
  const { enabled } = useAccessibilityContext();
  const { t } = useContext(TranslationContext);
  if (!enabled || !key) return undefined;
  // `key` is a caller-supplied string, so it bypasses the typed translation keys.
  return t(asDynamicKey(key), params);
};
