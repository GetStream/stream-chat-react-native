import { useContext, useMemo } from 'react';

import type { AccessibilityActionEvent, ViewProps } from 'react-native';

import { mergeAccessibilityActions } from '../../../a11y/a11yUtils';
import { useAccessibilityContext } from '../../../contexts/accessibilityContext/AccessibilityContext';
import { TranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useStableCallback } from '../../../hooks';
import {
  SCROLL_TO_BOTTOM_ACCESSIBILITY_LABEL_KEY,
  SCROLL_TO_BOTTOM_WITH_COUNT_ACCESSIBILITY_LABEL_KEY,
} from '../ScrollToBottomButton';

export const SCROLL_TO_BOTTOM_ACCESSIBILITY_ACTION_NAME = 'streamScrollToBottom';

type AccessibilityActions = ViewProps['accessibilityActions'];
type OnAccessibilityAction = ViewProps['onAccessibilityAction'];

/**
 * Declared explicitly rather than inferred. Left to inference, TypeScript expands
 * `AccessibilityActionEvent` into its structural shape when emitting the declaration, and that
 * shape names `HostInstance` - which React Native only exports from 0.78, while this SDK supports
 * `>=0.76`. Naming the props here keeps the emitted `.d.ts` referring to `ViewProps[...]`, which
 * resolves against whichever React Native the consumer actually has.
 */
export type UseScrollToBottomAccessibilityActionResult = {
  accessibilityActions: AccessibilityActions;
  onAccessibilityAction: OnAccessibilityAction;
};

type UseScrollToBottomAccessibilityActionParams = {
  accessibilityActions?: AccessibilityActions;
  onAccessibilityAction?: OnAccessibilityAction;
  onScrollToBottom: () => Promise<void> | void;
  unreadCount?: number;
  visible: boolean;
};

export const useScrollToBottomAccessibilityAction = ({
  accessibilityActions,
  onAccessibilityAction,
  onScrollToBottom,
  unreadCount,
  visible,
}: UseScrollToBottomAccessibilityActionParams): UseScrollToBottomAccessibilityActionResult => {
  const { enabled } = useAccessibilityContext();
  const { t } = useContext(TranslationContext);

  const scrollToBottomAccessibilityAction = useMemo(() => {
    if (!enabled || !visible) {
      return undefined;
    }

    return [
      {
        name: SCROLL_TO_BOTTOM_ACCESSIBILITY_ACTION_NAME,
        label: unreadCount
          ? t(SCROLL_TO_BOTTOM_WITH_COUNT_ACCESSIBILITY_LABEL_KEY, { count: unreadCount })
          : t(SCROLL_TO_BOTTOM_ACCESSIBILITY_LABEL_KEY),
      },
    ];
  }, [enabled, t, unreadCount, visible]);

  const mergedAccessibilityActions = useMemo(
    () => mergeAccessibilityActions(accessibilityActions, scrollToBottomAccessibilityAction),
    [accessibilityActions, scrollToBottomAccessibilityAction],
  );

  const handleAccessibilityAction = useStableCallback((event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === SCROLL_TO_BOTTOM_ACCESSIBILITY_ACTION_NAME) {
      return onScrollToBottom();
    }

    return onAccessibilityAction?.(event);
  });

  return {
    accessibilityActions: mergedAccessibilityActions.length
      ? mergedAccessibilityActions
      : undefined,
    onAccessibilityAction:
      (enabled && visible) || onAccessibilityAction
        ? handleAccessibilityAction
        : onAccessibilityAction,
  };
};
