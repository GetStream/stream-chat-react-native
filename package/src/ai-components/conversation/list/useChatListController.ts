import { type RefObject, useCallback, useRef } from 'react';

import type { LegendListRef } from '@legendapp/list/react-native';

import { useEndInView } from './useEndInView';
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

  const { isEndInView, scheduleCheckEnd } = useEndInView({ bottomInset, headerSize, listRef });
  const { anchoredEndSpace, contentFloor, onContainerLayout, onMetricsChange } = usePinnedAnchor({
    anchorKey,
    data,
    headerSize,
    keyExtractor,
    listRef,
    onAnchorLayout: scheduleCheckEnd,
  });
  const loadOlder = useLoadOlder({ listRef, loadOlderMessages });

  const scrollToEnd = useCallback(() => {
    void listRef.current?.scrollToEnd({ animated: !reduceMotion });
  }, [listRef, reduceMotion]);

  return {
    /** The least height of the list's content, for its `contentContainerStyle`. */
    contentFloor,
    isEndInView,
    /** Whether older rows load as the list nears its start, so it shows that they are loading. */
    loadsOlder: !!loadOlder,
    listProps: {
      anchoredEndSpace,
      onItemSizeChanged: scheduleCheckEnd,
      onMetricsChange,
      onScroll: scheduleCheckEnd,
      ...loadOlder,
    },
    /** For the view the list fills, which is there before the list is. */
    onContainerLayout,
    scrollToEnd,
  };
};
