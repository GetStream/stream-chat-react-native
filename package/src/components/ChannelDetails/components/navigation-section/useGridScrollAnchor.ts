import { useCallback, useLayoutEffect, useRef } from 'react';
import type { FlatList, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

type GridScrollAnchorParams = {
  columns: number;
  itemCount: number;
  /** Tile height plus the gap between rows. */
  rowStride: number;
};

/**
 * Keeps a grid's place when its column count changes.
 *
 * FlatList rejects a `numColumns` change on a mounted list, so the grid remounts under a new key,
 * which on its own resets it to the top - on every rotation that crosses the column breakpoint and
 * every fold. The first visible item is tracked while scrolling, and the remounted list is scrolled
 * to the row that now holds it once its content reaches that far.
 */
export const useGridScrollAnchor = <T>({
  columns,
  itemCount,
  rowStride,
}: GridScrollAnchorParams) => {
  const listRef = useRef<FlatList<T>>(null);
  const anchorIndexRef = useRef(0);
  const pendingRestoreRef = useRef(false);
  const lastColumnsRef = useRef(columns);
  const viewportRef = useRef<{ height: number; width: number } | null>(null);

  // A layout effect runs before the remounted list can report a scroll or content size.
  useLayoutEffect(() => {
    if (lastColumnsRef.current !== columns) {
      lastColumnsRef.current = columns;
      pendingRestoreRef.current = true;
    }
  }, [columns]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement } = event.nativeEvent;
      // A resize can clamp the offset before the grid re-lays out - rotating to a taller viewport
      // over shorter content does - and that is not the user scrolling.
      const previousViewport = viewportRef.current;
      const resized =
        !!previousViewport &&
        !!layoutMeasurement &&
        (previousViewport.width !== layoutMeasurement.width ||
          previousViewport.height !== layoutMeasurement.height);
      if (layoutMeasurement) {
        viewportRef.current = { height: layoutMeasurement.height, width: layoutMeasurement.width };
      }
      // The remounted list starts at the top; its scroll events must not overwrite the anchor.
      if (pendingRestoreRef.current || resized || rowStride <= 0) {
        return;
      }
      const row = Math.max(0, Math.floor(contentOffset.y / rowStride));
      anchorIndexRef.current = row * columns;
    },
    [columns, rowStride],
  );

  const onContentSizeChange = useCallback(
    (_width: number, height: number) => {
      if (!pendingRestoreRef.current) {
        return;
      }
      const lastRow = Math.max(0, Math.ceil(itemCount / columns) - 1);
      const offset = Math.min(Math.floor(anchorIndexRef.current / columns), lastRow) * rowStride;
      // Rows are laid out in batches; wait until the content reaches the target row.
      if (height < offset) {
        return;
      }
      pendingRestoreRef.current = false;
      if (offset > 0) {
        listRef.current?.scrollToOffset({ animated: false, offset });
      }
    },
    [columns, itemCount, rowStride],
  );

  return { listRef, onContentSizeChange, onScroll };
};
