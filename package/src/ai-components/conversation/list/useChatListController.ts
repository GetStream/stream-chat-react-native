import { type RefObject, useCallback, useRef } from 'react';

import { useKeyboardScrollToEnd } from '@legendapp/list/keyboard';
import type { LegendListRef } from '@legendapp/list/react-native';

import { useEndInView } from './useEndInView';
import { useKeyboardFrame } from './useKeyboardOverlap';
import { useLoadOlder } from './useLoadOlder';
import { usePinnedAnchor } from './usePinnedAnchor';

import { useReduceMotion } from '../../voice-visualization/useReduceMotion';

export type ChatListControllerOptions<T> = {
  /** The key of the row to pin to the top, such as the latest question's. */
  anchorKey: string | undefined;
  /** The room for a composer floating over the bottom of the list. */
  bottomInset: number;
  data: readonly T[];
  keyExtractor: (item: T) => string;
  listRef: RefObject<LegendListRef | null>;
  /** Loads the rows before the first one. `undefined` once there are none left. */
  loadOlderMessages?: () => Promise<void> | void;
};

/**
 * How a chat list behaves, apart from how it looks: the row to pin, whether the end is in view,
 * and loading older rows. Renders nothing: `listProps` go on a LegendList given `listRef`, and
 * the rest is for the views around it. Any LegendList that keeps `anchoredEndSpace` works.
 */
export const useChatListController = <T>({
  anchorKey,
  bottomInset,
  data,
  keyExtractor,
  listRef,
  loadOlderMessages,
}: ChatListControllerOptions<T>) => {
  const reduceMotion = useReduceMotion();
  // The list's positions leave its header out: the spinner while older messages load.
  const headerSize = useRef(0);

  // How far above the bottom of the screen the list ends, which the keyboard reaches past.
  const keyboardOffset = useRef(0);
  const checkEnd = useRef<() => void>(undefined);
  const keyboard = useKeyboardFrame(() => checkEnd.current?.());
  const { isEndInView, scheduleCheckEnd } = useEndInView({
    bottomInset,
    headerSize,
    keyboard,
    keyboardOffset,
    listRef,
  });
  checkEnd.current = scheduleCheckEnd;
  const { anchoredEndSpace, onMetricsChange } = usePinnedAnchor({
    anchorKey,
    data,
    headerSize,
    keyExtractor,
    listRef,
    onAnchorLayout: scheduleCheckEnd,
  });
  const loadOlder = useLoadOlder({ listRef, loadOlderMessages });

  // Holds the keyboard's own adjustments of the list still while it scrolls, so they don't stop it
  // short of the end above the keyboard.
  const { freeze, scrollMessageToEnd } = useKeyboardScrollToEnd({ listRef });
  const scrollToEnd = useCallback(() => {
    void scrollMessageToEnd({ animated: !reduceMotion, closeKeyboard: false });
  }, [reduceMotion, scrollMessageToEnd]);

  return {
    isEndInView,
    /** The keyboard, for views that ride it, such as the button back to the latest row. */
    keyboard,
    /** How far above the bottom of the screen the list ends; the list's view sets it. */
    keyboardOffset,
    /** Whether older rows load as the list nears its start, so it shows that they are loading. */
    loadsOlder: !!loadOlder,
    listProps: {
      anchoredEndSpace,
      freeze,
      // The list growing or shrinking, such as under a taller composer, can bring its end in or out of view.
      onLayout: scheduleCheckEnd,
      onItemSizeChanged: scheduleCheckEnd,
      onMetricsChange,
      onScroll: scheduleCheckEnd,
      ...loadOlder,
    },
    scrollToEnd,
  };
};
