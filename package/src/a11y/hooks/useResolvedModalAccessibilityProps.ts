import { Platform } from 'react-native';

import { useAccessibilityContext } from '../../contexts/accessibilityContext/AccessibilityContext';

export type ResolvedModalAccessibilityProps = {
  accessibilityViewIsModal?: boolean;
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
  accessibilityRole?: 'none' | 'button' | 'image' | 'text' | 'alert' | 'menu' | 'menuitem';
};

/**
 * Returns the platform-appropriate set of a11y props for a modal/sheet root.
 * Equivalent of stream-chat-react's `useResolvedModalAriaProps` — but aware of
 * RN's iOS-vs-Android split:
 *   - iOS uses `accessibilityViewIsModal` to trap focus.
 *   - Android uses `importantForAccessibility="yes"` on the modal root and
 *     `"no-hide-descendants"` on background siblings (caller's responsibility).
 *
 * Returns an empty object when AccessibilityContext is disabled, so the modal
 * stays a no-op for integrators that haven't opted in.
 */
export const useResolvedModalAccessibilityProps = (): ResolvedModalAccessibilityProps => {
  const { enabled } = useAccessibilityContext();
  if (!enabled) return {};

  if (Platform.OS === 'ios') {
    return { accessibilityViewIsModal: true };
  }
  return { importantForAccessibility: 'yes' };
};
