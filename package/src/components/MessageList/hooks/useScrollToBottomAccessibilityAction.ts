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
 * Spelled out so the emitted `.d.ts` refers to `ViewProps[...]`, which resolves against the
 * consumer's React Native. An inferred type expands `AccessibilityActionEvent` into a shape that
 * names `HostInstance`.
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
