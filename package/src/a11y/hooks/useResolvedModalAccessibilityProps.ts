import { Platform } from 'react-native';

import { useAccessibilityContext } from '../../contexts/accessibilityContext/AccessibilityContext';

export type ResolvedModalAccessibilityProps = {
  accessibilityViewIsModal?: boolean;
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
  accessibilityRole?: 'none' | 'button' | 'image' | 'text' | 'alert' | 'menu' | 'menuitem';
};

/**
 * Returns the accessibility props for a modal or sheet root: `accessibilityViewIsModal` on iOS
 * to trap focus, `importantForAccessibility="yes"` on Android. On Android the caller must also set
 * `"no-hide-descendants"` on background siblings.
 *
 * @returns The props to spread on the root, or an empty object when accessibility is disabled.
 */
export const useResolvedModalAccessibilityProps = (): ResolvedModalAccessibilityProps => {
  const { enabled } = useAccessibilityContext();
  if (!enabled) return {};

  if (Platform.OS === 'ios') {
    return { accessibilityViewIsModal: true };
  }
  return { importantForAccessibility: 'yes' };
};
