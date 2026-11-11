import { type RefObject, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';

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
 * and a new anchor is scrolled to once it is laid out. A content floor keeps it there while what
 * is below it shrinks, before the list has measured the change.
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
  const pendingScroll = useRef<{ animated: boolean; key: string } | undefined>(undefined);
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
    pendingScroll.current = { animated: continues && !reduceMotion, key: anchorKey };
  }, [anchorKey, data, keyExtractor, reduceMotion]);

  const scrollToPending = useCallback(
    (key: string | undefined) => {
      const target = pendingScroll.current;
      const list = listRef.current;
      if (!target || !list || key !== target.key) return;
      pendingScroll.current = undefined;
      void list.scrollToKey({ animated: target.animated, key: target.key, viewPosition: 0 });
    },
    [listRef],
  );

  // The least the content can be: the latest question's top plus the list's height, as the native
  // SDKs' latest turn is at least as tall as the conversation. The list leaves that room under the
  // latest turn itself, but only once it has measured what changed, while the content shrinks at
  // once when a row below the question does (a reasoning step folding, the thinking going), and the
  // list grows at once when the keyboard goes, either of which would pull the question down. So the
  // floor is the tallest the list has been at this width, such as without the keyboard.
  const viewport = useRef({ maxLength: 0, width: 0 });
  const [contentFloor, setContentFloor] = useState(0);
  const updateContentFloor = useCallback(
    (key: string | undefined) => {
      const state = listRef.current?.getState();
      const position = key === undefined ? undefined : state?.positionByKey(key);
      if (!state || position === undefined) {
        setContentFloor(0);
        return;
      }
      viewport.current.maxLength = Math.max(viewport.current.maxLength, state.scrollLength);
      setContentFloor(Math.ceil(position + headerSize.current + viewport.current.maxLength));
    },
    [headerSize, listRef],
  );
  const anchorKeyRef = useRef(anchorKey);
  anchorKeyRef.current = anchorKey;
  // The list fills this view, which is there before the list is, such as while the conversation
  // is empty and the keyboard comes up for its first question. A new width, such as on rotation,
  // has heights of its own.
  const onContainerLayout = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      if (layout.width !== viewport.current.width) {
        viewport.current = { maxLength: 0, width: layout.width };
      }
      if (layout.height <= viewport.current.maxLength) return;
      viewport.current.maxLength = layout.height;
      updateContentFloor(anchorKeyRef.current);
    },
    [updateContentFloor],
  );
  // The spinner above the turns coming or going moves the latest question.
  const onMetricsChange = useCallback(
    ({ headerSize: size }: { headerSize: number }) => {
      if (headerSize.current === size) return;
      headerSize.current = size;
      updateContentFloor(anchorKeyRef.current);
    },
    [headerSize, updateContentFloor],
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
              updateContentFloor(readyKey);
              scrollToPending(readyKey);
              onAnchorLayoutRef.current?.();
            },
            onSizeChanged: () => onAnchorLayoutRef.current?.(),
          }
        : undefined,
    [anchorIndex, scrollToPending, updateContentFloor],
  );

  return { anchoredEndSpace, contentFloor, onContainerLayout, onMetricsChange };
};
