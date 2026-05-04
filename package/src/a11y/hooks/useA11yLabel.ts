import { useAccessibilityContext } from '../../contexts/accessibilityContext/AccessibilityContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

/**
 * Returns the translated `a11y/...` label when the AccessibilityContext is enabled,
 * or `undefined` when disabled. Components pass the result straight to
 * `accessibilityLabel` so the i18n lookup is skipped on hot list paths in the
 * default disabled-state.
 *
 * Example:
 *   const label = useA11yLabel('a11y/Avatar of {{name}}', { name });
 *   <Image accessibilityLabel={label} />
 */
export const useA11yLabel = (key: string, params?: Record<string, unknown>): string | undefined => {
  const { enabled } = useAccessibilityContext();
  const { t } = useTranslationContext();
  if (!enabled) return undefined;
  return t(key, params);
};
