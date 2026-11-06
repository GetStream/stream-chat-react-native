import type { AccessibilityActionEvent, ViewProps } from 'react-native';

import { useAccessibilityContext } from '../../contexts/accessibilityContext/AccessibilityContext';

export type UseAccessibilityActivateActionProps<TPressEvent> = {
  onPress?: ((event: TPressEvent) => void) | null;
  shouldHandleActivate?: boolean;
};

export type UseAccessibilityActivateActionResult =
  | {
      accessibilityActions?: ViewProps['accessibilityActions'];
      onAccessibilityAction?: ViewProps['onAccessibilityAction'];
    }
  | undefined;

const accessibilityActivateActions: NonNullable<ViewProps['accessibilityActions']> = [
  { name: 'activate' },
];

/**
 * Returns the screen-reader `activate` accessibility action for a pressable, wired to `onPress`.
 * Some Android pressables do not map the TalkBack double-tap to `onPress`.
 *
 * @param params.onPress Press handler invoked on `activate`.
 * @param params.shouldHandleActivate Opts the pressable in. Defaults to false.
 * @returns The action props to spread on the pressable, or `undefined` when accessibility is
 * disabled, the opt-in is off or there is no `onPress`.
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
