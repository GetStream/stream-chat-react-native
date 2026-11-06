import { type RefObject, useCallback, useEffect, useRef } from 'react';

import type { LegendListRef } from '@legendapp/list/react-native';

// How long the spinner above the turns stays in view before older messages load, so a list that
// opens at its end does not load for the frame its start shows.
const LOAD_OLDER_DELAY_MS = 300;
// How long to wait before asking again after loading older messages failed.
const LOAD_OLDER_RETRY_MS = 3000;
// How close to the start, as a share of the list's height, the spinner counts as in view.
const START_THRESHOLD = 0.1;

export type UseLoadOlderOptions = {
  listRef: RefObject<LegendListRef | null>;
  /** Loads the rows before the first one. `undefined` once there are none left. */
  loadOlderMessages?: () => Promise<void> | void;
};

/**
 * Loads older messages once the spinner above the turns has been in view a moment, and again
 * while it stays in view after a load that failed, or brought nothing while there is more. Only
 * while the list is at rest: on iOS, what arrives above while a finger holds the list, or while
 * it glides or bounces, pushes what is in view down rather than staying out of sight.
 *
 * Returns the list's handlers for it, or none while there is nothing to load.
 */
export const useLoadOlder = ({ listRef, loadOlderMessages }: UseLoadOlderOptions) => {
  const dragging = useRef(false);
  const gliding = useRef(false);
  const loadOlderRef = useRef(loadOlderMessages);
  loadOlderRef.current = loadOlderMessages;
  const loading = useRef(false);
  const loadTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(true);
  const scheduleLoadOlder = useCallback(
    (delay: number) => {
      clearTimeout(loadTimer.current);
      loadTimer.current = setTimeout(async () => {
        const load = loadOlderRef.current;
        if (dragging.current || gliding.current) return;
        if (loading.current || !load || !listRef.current?.getState().isNearStart) return;
        loading.current = true;
        let failed = false;
        try {
          await load();
        } catch {
          failed = true;
        }
        loading.current = false;
        if (mounted.current) {
          scheduleLoadOlder(failed ? LOAD_OLDER_RETRY_MS : LOAD_OLDER_DELAY_MS);
        }
      }, delay);
    },
    [listRef],
  );
  const onStartReached = useCallback(
    () => scheduleLoadOlder(LOAD_OLDER_DELAY_MS),
    [scheduleLoadOlder],
  );
  // When the list comes to rest, a load the spinner asked for while it moved goes ahead. A glide
  // that follows the drag starts before the delay is up, and asks again when it ends.
  // A drag that stops a glide ends it, which may not say so itself.
  const onScrollBeginDrag = useCallback(() => {
    dragging.current = true;
    gliding.current = false;
  }, []);
  const onScrollEndDrag = useCallback(() => {
    dragging.current = false;
    scheduleLoadOlder(LOAD_OLDER_DELAY_MS);
  }, [scheduleLoadOlder]);
  const onMomentumScrollBegin = useCallback(() => {
    gliding.current = true;
  }, []);
  const onMomentumScrollEnd = useCallback(() => {
    gliding.current = false;
    scheduleLoadOlder(LOAD_OLDER_DELAY_MS);
  }, [scheduleLoadOlder]);

  useEffect(
    () => () => {
      mounted.current = false;
      clearTimeout(loadTimer.current);
    },
    [],
  );

  if (!loadOlderMessages) return undefined;
  return {
    onMomentumScrollBegin,
    onMomentumScrollEnd,
    onScrollBeginDrag,
    onScrollEndDrag,
    onStartReached,
    onStartReachedThreshold: START_THRESHOLD,
  };
};
