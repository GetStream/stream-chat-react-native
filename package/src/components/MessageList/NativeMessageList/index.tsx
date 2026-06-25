import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { HostComponent, LayoutChangeEvent, View } from 'react-native';

import { NativeHandlers, NativeMessageListViewProps } from '../../../native';

/** Distance (dp) from the bottom within which the list counts as pinned — matches the native
 *  stickThresholdPx so JS and native agree on "stuck". */
const BOTTOM_STICK_THRESHOLD = 120;

type RenderItemInfo<T> = { index: number; item: T };

export type NativeMessageListProps<T> = {
  data: ReadonlyArray<T>;
  /** Per-item height estimate (dp) used for not-yet-measured rows. */
  estimateItemHeight: number;
  renderItem: (info: RenderItemInfo<T>) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  /** Render-ahead buffer (dp) kept mounted above + below the viewport — the "view distance" knob. */
  renderAhead?: number;
  style?: NativeMessageListViewProps['style'];
};

/**
 * Custom native recycled list host (Android, New Arch only).
 *
 * JS owns variable-height windowing AND positioning; the native `StreamMessageListView` owns only
 * scrolling + emitting scroll offsets via `onStreamScroll`.
 *
 * Recycling (the perf core): the visible window maps onto a grow-only pool of cells keyed by **slot**
 * (a stable 0..N-1 identity), NOT by item id. As the window slides, a slot is *reassigned* to a new
 * data index — React re-renders the same cell instance with new props instead of unmounting one cell
 * and mounting another. So a row's (potentially heavy) view tree is built once and reused; only its
 * data rebinds. This is the difference between this and FlatList's mount/unmount-per-row model.
 */
/** Imperative surface exposed via ref — FlatList-shaped, so it drops into MessageList's existing
 *  scroll-to-bottom / jump-to-message paths. All three scrolls dispatch the single native command. */
export type NativeMessageListRef = {
  /** Scroll to the newest content (bottom). */
  scrollToEnd: (params?: { animated?: boolean }) => void;
  /** Scroll so the row at `index` reaches `viewPosition` (0 = top … 1 = bottom) of the viewport. */
  scrollToIndex: (params: { animated?: boolean; index: number; viewPosition?: number }) => void;
  /** Scroll to a content offset (dp). */
  scrollToOffset: (params: { animated?: boolean; offset: number }) => void;
};

function NativeMessageListComponent<T>(
  {
    data,
    estimateItemHeight,
    keyExtractor,
    renderAhead = 2000,
    renderItem,
    style,
  }: NativeMessageListProps<T>,
  ref: React.ForwardedRef<NativeMessageListRef>,
) {
  const Host = NativeHandlers.NativeMessageListView;
  const count = data.length;

  // Height cache keyed by item ID, NOT array index. An index cache misaligns on prepend: every row
  // shifts to a new index, but the cached heights stay at the old indices → wrong offsets → the whole
  // list lays out wrong then snaps as cells re-measure (the flicker). Keying by id survives reorders.
  const heightsRef = useRef<Map<string, number>>(new Map());
  const keyAt = (i: number): string => (keyExtractor ? keyExtractor(data[i], i) : String(i));

  const viewportRef = useRef(0);
  const scrollYRef = useRef(0);
  const anchorRef = useRef(Number.NEGATIVE_INFINITY);
  const didInitBottom = useRef(false);
  // Whether the list is pinned to the bottom (mirrors native stick-to-bottom), tracked from scroll
  // events so the synchronous render right after a prepend/append still knows to keep the tail mounted.
  const atBottomRef = useRef(true);
  // Head item + count from the last render, used to detect a front-prepend and follow it synchronously.
  const prevFirstKeyRef = useRef<string | null>(null);
  const prevCountRef = useRef(0);

  // Recycle pool. slotToIndexRef.current[s] = the data index slot s currently renders (-1 = free).
  // Grow-only (never shrinks → no remount churn). Cells are keyed by slot, so React keeps the
  // instance and just rebinds props as the window slides.
  const slotToIndexRef = useRef<number[]>([]);
  const hostRef = useRef<React.ElementRef<HostComponent<NativeMessageListViewProps>> | null>(null);

  const [version, setVersion] = useState(0);
  const [range, setRange] = useState({ end: 0, start: 0 });

  const { offsets, total } = useMemo(() => {
    const heights = heightsRef.current;
    const offs = new Array<number>(count + 1);
    offs[0] = 0;
    for (let i = 0; i < count; i++) {
      offs[i + 1] = offs[i] + (heights.get(keyAt(i)) ?? estimateItemHeight);
    }
    return { offsets: offs, total: offs[count] };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, data, estimateItemHeight, version]);

  const totalRef = useRef(0);
  totalRef.current = total;
  const offsetsRef = useRef(offsets);
  offsetsRef.current = offsets;

  const indexForOffset = useCallback(
    (y: number) => {
      let lo = 0;
      let hi = count;
      while (lo < hi) {
        // eslint-disable-next-line no-bitwise
        const mid = (lo + hi + 1) >> 1;
        if (offsets[mid] <= y) {
          lo = mid;
        } else {
          hi = mid - 1;
        }
      }
      return Math.max(0, Math.min(lo, count - 1));
    },
    [count, offsets],
  );

  const recompute = useCallback(
    (scrollY: number) => {
      if (!count) {
        return;
      }
      const viewport = viewportRef.current || 0;
      const start = indexForOffset(scrollY - renderAhead);
      const end = indexForOffset(scrollY + viewport + renderAhead);
      setRange((prev) => (prev.start === start && prev.end === end ? prev : { end, start }));
    },
    [count, indexForOffset, renderAhead],
  );

  const onStreamScroll = useCallback<NonNullable<NativeMessageListViewProps['onStreamScroll']>>(
    (event) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      viewportRef.current = layoutMeasurement.height;
      scrollYRef.current = contentOffset.y;
      atBottomRef.current =
        contentOffset.y >= contentSize.height - layoutMeasurement.height - BOTTOM_STICK_THRESHOLD;
      if (Math.abs(contentOffset.y - anchorRef.current) > renderAhead / 2) {
        anchorRef.current = contentOffset.y;
        recompute(contentOffset.y);
      }
    },
    [recompute, renderAhead],
  );

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const viewport = event.nativeEvent.layout.height;
      viewportRef.current = viewport;
      // Open anchored at the bottom (newest content): seed the JS window to the last screenful so the
      // first render shows the bottom rows; native's stick-to-bottom pins the scroll position to match.
      if (!didInitBottom.current && totalRef.current > viewport) {
        scrollYRef.current = totalRef.current - viewport;
        didInitBottom.current = true;
      }
      recompute(scrollYRef.current);
    },
    [recompute],
  );

  const onCellLayout = useCallback((key: string, height: number) => {
    if (height > 0 && Math.abs((heightsRef.current.get(key) ?? 0) - height) > 0.5) {
      heightsRef.current.set(key, height);
      setVersion((v) => v + 1);
    }
  }, []);

  // Re-window when offsets shift (a measurement landed).
  useEffect(() => {
    recompute(scrollYRef.current);
  }, [recompute, version]);

  // Front-prepend, scrolled up: native anchors the scroll by the inserted height, but the JS window
  // would only catch up after a scroll-event round-trip → trailing-edge blank for a frame (#1). Detect
  // the prepend and, in the SAME commit (useLayoutEffect = before paint): (a) shift scrollYRef by the
  // inserted height, and (b) shift every pool slot's index by the prepended count so each slot keeps
  // rendering the SAME item (indices moved, items didn't). Keeping item↔slot stable is what preserves
  // both the visible position and the native MVCP View-anchor (the anchor cell still shows the anchor
  // item — recycling would otherwise break it, since slots aren't keyed by item).
  useLayoutEffect(() => {
    const firstKey = count > 0 ? keyAt(0) : null;
    if (
      prevFirstKeyRef.current !== null &&
      firstKey !== prevFirstKeyRef.current &&
      count > prevCountRef.current
    ) {
      const added = count - prevCountRef.current;
      let prepended = 0;
      for (let i = 1; i <= added && i < count; i++) {
        if (keyAt(i) === prevFirstKeyRef.current) {
          prepended = i;
          break;
        }
      }
      if (prepended > 0) {
        const slots = slotToIndexRef.current;
        for (let s = 0; s < slots.length; s++) {
          if (slots[s] >= 0) {
            slots[s] += prepended;
          }
        }
        scrollYRef.current += offsets[prepended];
        recompute(scrollYRef.current);
      }
    }
    prevFirstKeyRef.current = firstKey;
    prevCountRef.current = count;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, offsets, recompute]);

  // Imperative ref (FlatList-shaped). Every scroll computes a target offset from the JS height model
  // and dispatches the single native `scrollToOffset` command (offsets read from refs so the handle
  // stays correct without re-creating every render).
  useImperativeHandle(
    ref,
    () => ({
      scrollToEnd: ({ animated = true }: { animated?: boolean } = {}) => {
        const cmds = NativeHandlers.NativeMessageListViewCommands;
        if (cmds && hostRef.current) {
          cmds.scrollToOffset(hostRef.current, totalRef.current, animated);
        }
      },
      scrollToIndex: ({
        animated = true,
        index,
        viewPosition = 0,
      }: {
        animated?: boolean;
        index: number;
        viewPosition?: number;
      }) => {
        const cmds = NativeHandlers.NativeMessageListViewCommands;
        if (!cmds || !hostRef.current || !count) {
          return;
        }
        const i = Math.max(0, Math.min(index, count - 1));
        const key = keyExtractor ? keyExtractor(data[i], i) : String(i);
        const h = heightsRef.current.get(key) ?? estimateItemHeight;
        const target = offsetsRef.current[i] - viewPosition * ((viewportRef.current || 0) - h);
        cmds.scrollToOffset(hostRef.current, target, animated);
      },
      scrollToOffset: ({ animated = true, offset }: { animated?: boolean; offset: number }) => {
        const cmds = NativeHandlers.NativeMessageListViewCommands;
        if (cmds && hostRef.current) {
          cmds.scrollToOffset(hostRef.current, offset, animated);
        }
      },
    }),
    [count, data, estimateItemHeight, keyExtractor],
  );

  if (!Host) {
    return <View style={style} />;
  }

  let start = Math.max(0, Math.min(range.start, count - 1));
  let end = Math.min(range.end, count - 1);
  // Pinned to the bottom: keep the newest rows mounted on the synchronous render after a prepend/append.
  // The reactive window range lags the shifted indices by a scroll-event round-trip, so without this the
  // stuck viewport sits over the not-yet-mounted tail for a frame → whole-list black flicker.
  if (atBottomRef.current && count > 0) {
    end = count - 1;
    start = Math.max(0, indexForOffset(total - viewportRef.current - renderAhead));
  }

  // Reconcile the recycle pool to the window [start, end]: free slots that fell out of the window,
  // then assign each now-visible index without a slot to a freed one (the reused cell). Idempotent, so
  // a StrictMode double-render is a no-op. Grows the pool when the window needs more cells than exist.
  const slots = slotToIndexRef.current;
  if (count > 0) {
    const covered = new Set<number>();
    for (let s = 0; s < slots.length; s++) {
      const idx = slots[s];
      if (idx >= start && idx <= end && idx < count) {
        covered.add(idx);
      } else {
        slots[s] = -1;
      }
    }
    const need = end - start + 1;
    while (slots.length < need) {
      slots.push(-1);
    }
    let scan = 0;
    for (let i = start; i <= end; i++) {
      if (!covered.has(i)) {
        while (scan < slots.length && slots[scan] !== -1) {
          scan++;
        }
        if (scan < slots.length) {
          slots[scan] = i;
        }
      }
    }
  } else {
    for (let s = 0; s < slots.length; s++) {
      slots[s] = -1;
    }
  }

  const cells: React.ReactNode[] = [];
  for (let s = 0; s < slots.length; s++) {
    const idx = slots[s];
    const active = idx >= 0 && idx < count;
    cells.push(
      <RecycledCell
        active={active}
        cacheKey={active ? keyAt(idx) : ''}
        index={active ? idx : -1}
        item={active ? data[idx] : undefined}
        key={s}
        onCellLayout={onCellLayout}
        renderItem={renderItem as (info: RenderItemInfo<unknown>) => React.ReactNode}
        top={active ? offsets[idx] : 0}
      />,
    );
  }

  return (
    <Host
      contentHeight={total}
      onLayout={onLayout}
      onStreamScroll={onStreamScroll}
      ref={hostRef}
      style={style}
    >
      <View style={{ height: total }} />
      {cells}
    </Host>
  );
}

// forwardRef wrapper, cast to keep the generic <T> at the call site (forwardRef erases it).
export const NativeMessageList = React.forwardRef(NativeMessageListComponent) as <T>(
  props: NativeMessageListProps<T> & { ref?: React.Ref<NativeMessageListRef> },
) => React.ReactElement | null;

type RecycledCellProps = {
  active: boolean;
  cacheKey: string;
  index: number;
  item: unknown;
  onCellLayout: (key: string, height: number) => void;
  renderItem: (info: RenderItemInfo<unknown>) => React.ReactNode;
  top: number;
};

// A pool slot. Memoized: when its slot isn't reassigned (same index/top/item), it bails out of
// re-rendering entirely; when it IS reassigned, it re-renders with the new item — reusing the
// existing view tree (the recycle win). Renders null while free, keeping the slot's identity stable.
const RecycledCell = React.memo(function RecycledCell({
  active,
  cacheKey,
  index,
  item,
  onCellLayout,
  renderItem,
  top,
}: RecycledCellProps) {
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (active) {
        onCellLayout(cacheKey, event.nativeEvent.layout.height);
      }
    },
    [active, cacheKey, onCellLayout],
  );
  if (!active) {
    return null;
  }
  return (
    <View
      collapsable={false}
      onLayout={handleLayout}
      style={{ left: 0, position: 'absolute', right: 0, top }}
    >
      {renderItem({ index, item })}
    </View>
  );
});
