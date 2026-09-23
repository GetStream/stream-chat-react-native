import { useLayoutEffect, useMemo, useRef } from 'react';
import type {
  FlatList,
  FlatListProps,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';

type ScrollHandlerProps<T> = Pick<
  FlatListProps<T>,
  | 'onContentSizeChange'
  | 'onMomentumScrollBegin'
  | 'onMomentumScrollEnd'
  | 'onScroll'
  | 'onScrollBeginDrag'
  | 'onScrollEndDrag'
>;

type GridScrollAnchorParams<T> = {
  columns: number;
  itemCount: number;
  /** Tile height plus the gap between rows. */
  rowStride: number;
  /** The consumer's own handlers, which keep firing alongside the anchor's. */
  listProps?: ScrollHandlerProps<T>;
};

type ScrollEvent = NativeSyntheticEvent<NativeScrollEvent>;

/**
 * Keeps a grid's place when its column count changes.
 *
 * FlatList rejects a `numColumns` change on a mounted list, so the grid remounts under a new key,
 * which on its own resets it to the top - on every rotation that crosses the column breakpoint and
 * every fold. The first visible item is tracked, and the remounted list is scrolled to the row that
 * now holds it.
 *
 * Only user-driven scrolling moves the anchor: a resize clamps the offset of a list whose content is
 * shorter than its new viewport, and both platforms report that as ordinary scroll events.
 *
 * The restore is re-applied as the content grows until a scroll event confirms it landed. The
 * reported content size covers only the rows rendered so far, so a single attempt can be clamped
 * short of the target - on Android it is, by several rows.
 */
export const useGridScrollAnchor = <T>({
  columns,
  itemCount,
  listProps,
  rowStride,
}: GridScrollAnchorParams<T>) => {
  const listRef = useRef<FlatList<T>>(null);
  const anchorIndexRef = useRef(0);
  const pendingRestoreRef = useRef(false);
  const restoreTargetRef = useRef(0);
  const userScrollingRef = useRef(false);
  const dragEndedRef = useRef(false);
  const lastColumnsRef = useRef(columns);

  // A layout effect runs before the remounted list can report a scroll or content size.
  useLayoutEffect(() => {
    if (lastColumnsRef.current !== columns) {
      lastColumnsRef.current = columns;
      pendingRestoreRef.current = true;
      // Any momentum from here on belongs to the restore, not to an earlier drag.
      dragEndedRef.current = false;
      userScrollingRef.current = false;
    }
  }, [columns]);

  const {
    onContentSizeChange,
    onMomentumScrollBegin,
    onMomentumScrollEnd,
    onScroll,
    onScrollBeginDrag,
    onScrollEndDrag,
  } = listProps ?? {};

  const scrollProps = useMemo<ScrollHandlerProps<T>>(() => {
    const track = (event: ScrollEvent) => {
      if (pendingRestoreRef.current || rowStride <= 0) {
        return;
      }
      const row = Math.max(0, Math.floor(event.nativeEvent.contentOffset.y / rowStride));
      anchorIndexRef.current = row * columns;
    };

    return {
      onContentSizeChange: (width: number, height: number) => {
        onContentSizeChange?.(width, height);
        if (!pendingRestoreRef.current) {
          return;
        }
        const lastRow = Math.max(0, Math.ceil(itemCount / columns) - 1);
        const offset = Math.min(Math.floor(anchorIndexRef.current / columns), lastRow) * rowStride;
        if (offset <= 0) {
          pendingRestoreRef.current = false;
          return;
        }
        restoreTargetRef.current = offset;
        listRef.current?.scrollToOffset({ animated: false, offset });
      },
      onMomentumScrollBegin: (event: ScrollEvent) => {
        onMomentumScrollBegin?.(event);
        // Only a fling after a drag. iOS also reports momentum for a programmatic scroll - the
        // restore included - and tracking it would re-round the anchor down to a whole row.
        userScrollingRef.current = dragEndedRef.current;
      },
      onMomentumScrollEnd: (event: ScrollEvent) => {
        onMomentumScrollEnd?.(event);
        if (userScrollingRef.current) {
          track(event);
        }
        userScrollingRef.current = false;
        dragEndedRef.current = false;
      },
      onScroll: (event: ScrollEvent) => {
        onScroll?.(event);
        if (
          pendingRestoreRef.current &&
          Math.abs(event.nativeEvent.contentOffset.y - restoreTargetRef.current) < 1
        ) {
          pendingRestoreRef.current = false;
        }
        if (userScrollingRef.current) {
          track(event);
        }
      },
      onScrollBeginDrag: (event: ScrollEvent) => {
        onScrollBeginDrag?.(event);
        // The user taking over ends any restore still in progress.
        pendingRestoreRef.current = false;
        userScrollingRef.current = true;
        dragEndedRef.current = false;
        track(event);
      },
      onScrollEndDrag: (event: ScrollEvent) => {
        onScrollEndDrag?.(event);
        track(event);
        // A fling that follows reports onMomentumScrollBegin and resumes tracking.
        userScrollingRef.current = false;
        dragEndedRef.current = true;
      },
    };
  }, [
    columns,
    itemCount,
    onContentSizeChange,
    onMomentumScrollBegin,
    onMomentumScrollEnd,
    onScroll,
    onScrollBeginDrag,
    onScrollEndDrag,
    rowStride,
  ]);

  return { listRef, scrollProps };
};
