import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';

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
 * JS owns variable-height windowing AND positioning: each mounted cell is absolutely positioned at
 * its prefix-sum offset (so Fabric owns the layout metrics and draws/clips correctly) over a
 * full-height spacer; the native `StreamMessageListView` owns only scrolling + emitting scroll
 * offsets via `onStreamScroll`. Cells measure themselves (onLayout) to correct the offset model.
 * Falls back to a plain `<View>` when the native host is absent.
 */
export function NativeMessageList<T>({
  data,
  estimateItemHeight,
  keyExtractor,
  renderAhead = 2000,
  renderItem,
  style,
}: NativeMessageListProps<T>) {
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
  const cells: React.ReactNode[] = [];
  for (let i = start; i <= end && i < count; i++) {
    const item = data[i];
    const cacheKey = keyAt(i);
    cells.push(
      <NativeMessageCell
        cacheKey={cacheKey}
        key={cacheKey}
        onCellLayout={onCellLayout}
        top={offsets[i]}
      >
        {renderItem({ index: i, item })}
      </NativeMessageCell>,
    );
  }

  return (
    <Host contentHeight={total} onLayout={onLayout} onStreamScroll={onStreamScroll} style={style}>
      <View style={{ height: total }} />
      {cells}
    </Host>
  );
}

type NativeMessageCellProps = {
  cacheKey: string;
  children: React.ReactNode;
  onCellLayout: (key: string, height: number) => void;
  top: number;
};

const NativeMessageCell = React.memo(function NativeMessageCell({
  cacheKey,
  children,
  onCellLayout,
  top,
}: NativeMessageCellProps) {
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => onCellLayout(cacheKey, event.nativeEvent.layout.height),
    [cacheKey, onCellLayout],
  );
  return (
    <View
      collapsable={false}
      onLayout={handleLayout}
      style={{ left: 0, position: 'absolute', right: 0, top }}
    >
      {children}
    </View>
  );
});
