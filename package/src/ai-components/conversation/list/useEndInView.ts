import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';

import type { LegendListRef } from '@legendapp/list/react-native';

// How far from the end still counts as at the end.
const END_SLACK = 32;

export type UseEndInViewOptions = {
  /** The room for a composer floating over the bottom of the list, which is not in view. */
  bottomInset: number;
  /** The height of the list's header, which its positions leave out. */
  headerSize: RefObject<number>;
  listRef: RefObject<LegendListRef | null>;
};

/**
 * Whether the end of the last row's content is in view: not the room the anchored latest turn
 * leaves under a short reply, nor the room for the floating composer. Call `scheduleCheckEnd`
 * whenever that may have changed: a scroll, or a row changing size without one, such as an answer
 * typing out. It checks once a frame at most.
 */
export const useEndInView = ({ bottomInset, headerSize, listRef }: UseEndInViewOptions) => {
  const [isEndInView, setIsEndInView] = useState(true);
  const bottomInsetRef = useRef(bottomInset);
  bottomInsetRef.current = bottomInset;
  const checkEnd = useCallback(() => {
    const state = listRef.current?.getState();
    const last = (state?.data.length ?? 0) - 1;
    if (!state || last < 0) return;
    const end = headerSize.current + state.positionAtIndex(last) + state.sizeAtIndex(last);
    const visibleEnd = state.scroll + state.scrollLength - bottomInsetRef.current;
    setIsEndInView(end <= visibleEnd + END_SLACK);
  }, [headerSize, listRef]);

  const checkFrame = useRef<number | undefined>(undefined);
  const scheduleCheckEnd = useCallback(() => {
    if (checkFrame.current !== undefined) return;
    checkFrame.current = requestAnimationFrame(() => {
      checkFrame.current = undefined;
      checkEnd();
    });
  }, [checkEnd]);
  useEffect(() => () => cancelAnimationFrame(checkFrame.current ?? 0), []);

  return { isEndInView, scheduleCheckEnd };
};
