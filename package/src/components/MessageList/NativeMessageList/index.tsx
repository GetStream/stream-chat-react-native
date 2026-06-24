import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';

import { NativeHandlers, NativeMessageListViewProps } from '../../../native';

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
 * (Native offset-mirror positioning was tried and abandoned — natively-set child.layout doesn't
 * compose with Fabric's draw path.) Falls back to a plain `<View>` when the native host is absent.
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

  const heightsRef = useRef<number[]>([]);
  if (heightsRef.current.length !== count) {
    const next = heightsRef.current.slice(0, count);
    for (let i = next.length; i < count; i++) {
      next[i] = estimateItemHeight;
    }
    heightsRef.current = next;
  }

  const viewportRef = useRef(0);
  const scrollYRef = useRef(0);
  const anchorRef = useRef(Number.NEGATIVE_INFINITY);
  const [version, setVersion] = useState(0);
  const [range, setRange] = useState({ end: 0, start: 0 });

  const { offsets, total } = useMemo(() => {
    const heights = heightsRef.current;
    const offs = new Array<number>(count + 1);
    offs[0] = 0;
    for (let i = 0; i < count; i++) {
      offs[i + 1] = offs[i] + (heights[i] || estimateItemHeight);
    }
    return { offsets: offs, total: offs[count] };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, estimateItemHeight, version]);

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
      const { contentOffset, layoutMeasurement } = event.nativeEvent;
      viewportRef.current = layoutMeasurement.height;
      scrollYRef.current = contentOffset.y;
      if (Math.abs(contentOffset.y - anchorRef.current) > renderAhead / 2) {
        anchorRef.current = contentOffset.y;
        recompute(contentOffset.y);
      }
    },
    [recompute, renderAhead],
  );

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      viewportRef.current = event.nativeEvent.layout.height;
      recompute(scrollYRef.current);
    },
    [recompute],
  );

  const onCellLayout = useCallback((index: number, height: number) => {
    if (height > 0 && Math.abs((heightsRef.current[index] ?? 0) - height) > 0.5) {
      heightsRef.current[index] = height;
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

  const start = Math.max(0, Math.min(range.start, count - 1));
  const end = Math.min(range.end, count - 1);
  const cells: React.ReactNode[] = [];
  for (let i = start; i <= end && i < count; i++) {
    const item = data[i];
    cells.push(
      <NativeMessageCell
        index={i}
        key={keyExtractor ? keyExtractor(item, i) : i}
        onCellLayout={onCellLayout}
        top={offsets[i]}
      >
        {renderItem({ index: i, item })}
      </NativeMessageCell>,
    );
  }

  return (
    <Host onLayout={onLayout} onStreamScroll={onStreamScroll} style={style}>
      <View style={{ height: total }} />
      {cells}
    </Host>
  );
}

type NativeMessageCellProps = {
  children: React.ReactNode;
  index: number;
  onCellLayout: (index: number, height: number) => void;
  top: number;
};

const NativeMessageCell = React.memo(function NativeMessageCell({
  children,
  index,
  onCellLayout,
  top,
}: NativeMessageCellProps) {
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => onCellLayout(index, event.nativeEvent.layout.height),
    [index, onCellLayout],
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
