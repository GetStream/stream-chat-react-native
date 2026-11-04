import { type RefObject, useCallback, useLayoutEffect, useMemo, useRef } from 'react';

import type { AnchoredEndSpaceConfig, LegendListRef } from '@legendapp/list/react-native';

import { useReduceMotion } from '../../voice-visualization/useReduceMotion';

export type UsePinnedAnchorOptions<T> = {
  /** The key of the row to pin to the top, such as the latest question's. */
  anchorKey: string | undefined;
  data: readonly T[];
  /** The height of the list's header, which its positions leave out. */
  headerSize: RefObject<number>;
  keyExtractor: (item: T) => string;
  listRef: RefObject<LegendListRef | null>;
  /** Called once the anchor is laid out, and whenever the room the list leaves under it changes. */
  onAnchorLayout?: () => void;
};

/**
 * Pins a row to the top of what is visible: the list leaves room under it (`anchoredEndSpace`),
 * and a new anchor is scrolled to once it is laid out. The keyboard-aware list keeps that room as
 * the scroll view's inset, which follows what is below the row shrinking, and which the keyboard
 * takes before it lifts anything.
 */
export const usePinnedAnchor = <T>({
  anchorKey,
  data,
  headerSize,
  keyExtractor,
  listRef,
  onAnchorLayout,
}: UsePinnedAnchorOptions<T>) => {
  const reduceMotion = useReduceMotion();
  const onAnchorLayoutRef = useRef(onAnchorLayout);
  onAnchorLayoutRef.current = onAnchorLayout;

  // Where to scroll once the anchor is laid out: a new question pins to the top, and a
  // conversation replaced as a whole opens at its end.
  const pendingScroll = useRef<{ animated: boolean; key: string; toEnd: boolean } | undefined>(
    undefined,
  );
  const shown = useRef<{ anchorKey?: string; mounted: boolean }>({ mounted: false });
  useLayoutEffect(() => {
    const previous = shown.current;
    shown.current = { anchorKey, mounted: true };
    if (!previous.mounted || anchorKey === undefined || anchorKey === previous.anchorKey) {
      return;
    }
    const continues =
      previous.anchorKey !== undefined &&
      data.some((item) => keyExtractor(item) === previous.anchorKey);
    pendingScroll.current = continues
      ? { animated: !reduceMotion, key: anchorKey, toEnd: false }
      : { animated: false, key: anchorKey, toEnd: true };
  }, [anchorKey, data, keyExtractor, reduceMotion]);

  const scrollToPending = useCallback(
    (key: string | undefined) => {
      const target = pendingScroll.current;
      const list = listRef.current;
      if (!target || !list || key !== target.key) return;
      pendingScroll.current = undefined;
      // The keyboard-aware list keeps the room under the anchor as the scroll view's inset, which
      // it sets on the UI thread a frame or two after the room changes. iOS stops a scroll at the
      // inset it has when the scroll starts, so a scroll started now stops short of the top.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const current = listRef.current;
          if (target.toEnd) {
            void current?.scrollToEnd({ animated: false });
            return;
          }
          void current?.scrollToKey({
            animated: target.animated,
            key: target.key,
            viewPosition: 0,
          });
        }),
      );
    },
    [listRef],
  );

  // The spinner above the turns: the list's positions leave it out.
  const onMetricsChange = useCallback(
    ({ headerSize: size }: { headerSize: number }) => {
      headerSize.current = size;
    },
    [headerSize],
  );

  const anchorIndex = useMemo(
    () =>
      anchorKey === undefined ? -1 : data.findIndex((item) => keyExtractor(item) === anchorKey),
    [anchorKey, data, keyExtractor],
  );
  const anchoredEndSpace = useMemo<AnchoredEndSpaceConfig | undefined>(
    () =>
      anchorIndex >= 0
        ? {
            anchorIndex,
            onReady: ({ anchorKey: readyKey }) => {
              scrollToPending(readyKey);
              onAnchorLayoutRef.current?.();
            },
            onSizeChanged: () => onAnchorLayoutRef.current?.(),
          }
        : undefined,
    [anchorIndex, scrollToPending],
  );

  return { anchoredEndSpace, onMetricsChange };
};
