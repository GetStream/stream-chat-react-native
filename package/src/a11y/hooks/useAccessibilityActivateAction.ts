import type { AccessibilityActionEvent, AccessibilityProps } from 'react-native';

import { useAccessibilityContext } from '../../contexts/accessibilityContext/AccessibilityContext';

export type UseAccessibilityActivateActionProps<TPressEvent> = {
  onPress?: ((event: TPressEvent) => void) | null;
  shouldHandleActivate?: boolean;
};

export type UseAccessibilityActivateActionResult =
  | {
      accessibilityActions?: AccessibilityProps['accessibilityActions'];
      onAccessibilityAction?: AccessibilityProps['onAccessibilityAction'];
    }
  | undefined;

const accessibilityActivateActions: NonNullable<AccessibilityProps['accessibilityActions']> = [
  { name: 'activate' },
];

/**
 * Adds the standard screen-reader `activate` action for labeled pressables when
 * SDK accessibility is enabled. Some Android pressable implementations don't
 * reliably map TalkBack double-tap to `onPress`, so this bridges the generated
 * accessibility action back to the existing press handler.
 */
export const useAccessibilityActivateAction = <TPressEvent>({
  onPress,
  shouldHandleActivate = false,
}: UseAccessibilityActivateActionProps<TPressEvent>): UseAccessibilityActivateActionResult => {
  const { enabled } = useAccessibilityContext();
  const shouldHandleAccessibilityActivate = enabled && shouldHandleActivate && !!onPress;

  if (!shouldHandleAccessibilityActivate) return undefined;

  return {
    accessibilityActions: accessibilityActivateActions,
    onAccessibilityAction: (event: AccessibilityActionEvent) => {
      if (event.nativeEvent.actionName !== 'activate') return;

      onPress(event as unknown as TPressEvent);
    },
  };
};
