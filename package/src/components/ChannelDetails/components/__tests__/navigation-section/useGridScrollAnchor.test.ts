import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import { renderHook } from '@testing-library/react-native';

import { useGridScrollAnchor } from '../../navigation-section/useGridScrollAnchor';

type Props = Parameters<typeof useGridScrollAnchor>[0];
type Result = { current: ReturnType<typeof useGridScrollAnchor> };

const scrollEvent = (y: number) =>
  ({ nativeEvent: { contentOffset: { x: 0, y } } }) as NativeSyntheticEvent<NativeScrollEvent>;

/** A drag that ends at `y`, the way a user scrolls. */
const userScroll = (result: Result, y: number) => {
  result.current.scrollProps.onScrollBeginDrag?.(scrollEvent(0));
  result.current.scrollProps.onScroll?.(scrollEvent(y));
  result.current.scrollProps.onScrollEndDrag?.(scrollEvent(y));
};

const setup = (initialProps: Props) => {
  const hook = renderHook((props: Props) => useGridScrollAnchor(props), { initialProps });
  const scrollToOffset = jest.fn();
  (hook.result.current.listRef as { current: unknown }).current = { scrollToOffset };
  return { ...hook, scrollToOffset };
};

describe('useGridScrollAnchor', () => {
  it('scrolls the remounted list back to the row holding the first visible item', () => {
    // 3 columns, 100pt rows: an offset of 450 puts row 4 (items 12-14) first.
    const { rerender, result, scrollToOffset } = setup({
      columns: 3,
      itemCount: 60,
      rowStride: 100,
    });
    userScroll(result, 450);

    // Rotating to 6 columns of 50pt rows: item 12 is now in row 2.
    rerender({ columns: 6, itemCount: 60, rowStride: 50 });
    result.current.scrollProps.onContentSizeChange?.(400, 500);

    expect(scrollToOffset).toHaveBeenCalledWith({ animated: false, offset: 100 });
  });

  it('does nothing on the first mount', () => {
    const { result, scrollToOffset } = setup({ columns: 3, itemCount: 60, rowStride: 100 });
    userScroll(result, 450);
    result.current.scrollProps.onContentSizeChange?.(400, 5000);

    expect(scrollToOffset).not.toHaveBeenCalled();
  });

  // Rotating to a taller viewport over shorter content clamps the offset before the grid re-lays
  // out, and both platforms report that as scroll events - Android even after the new viewport.
  it('ignores scroll events that are not the user scrolling', () => {
    const { rerender, result, scrollToOffset } = setup({
      columns: 3,
      itemCount: 60,
      rowStride: 100,
    });
    userScroll(result, 450);
    result.current.scrollProps.onScroll?.(scrollEvent(120));
    result.current.scrollProps.onScroll?.(scrollEvent(0));

    rerender({ columns: 6, itemCount: 60, rowStride: 50 });
    result.current.scrollProps.onContentSizeChange?.(400, 500);

    expect(scrollToOffset).toHaveBeenCalledWith({ animated: false, offset: 100 });
  });

  it('keeps tracking through the fling that follows a drag', () => {
    const { rerender, result, scrollToOffset } = setup({
      columns: 3,
      itemCount: 60,
      rowStride: 100,
    });
    userScroll(result, 250);
    result.current.scrollProps.onMomentumScrollBegin?.(scrollEvent(250));
    result.current.scrollProps.onScroll?.(scrollEvent(400));
    result.current.scrollProps.onMomentumScrollEnd?.(scrollEvent(450));

    rerender({ columns: 6, itemCount: 60, rowStride: 50 });
    result.current.scrollProps.onContentSizeChange?.(400, 500);

    expect(scrollToOffset).toHaveBeenCalledWith({ animated: false, offset: 100 });
  });

  // The reported content size covers only the rows rendered so far, so the first attempt can be
  // clamped short of the target. Observed on Android: asked for 827pt, landed at 575pt.
  it('re-applies the restore as the content grows until the list lands on it', () => {
    const { rerender, result, scrollToOffset } = setup({
      columns: 3,
      itemCount: 60,
      rowStride: 100,
    });
    userScroll(result, 1500);
    rerender({ columns: 6, itemCount: 60, rowStride: 50 });

    // Item 45 lands in row 7, at 350pt; the first attempt is clamped at 120pt.
    result.current.scrollProps.onContentSizeChange?.(400, 300);
    result.current.scrollProps.onScroll?.(scrollEvent(120));
    result.current.scrollProps.onContentSizeChange?.(400, 900);
    result.current.scrollProps.onScroll?.(scrollEvent(350));
    result.current.scrollProps.onContentSizeChange?.(400, 2000);

    expect(scrollToOffset).toHaveBeenCalledTimes(2);
    expect(scrollToOffset).toHaveBeenLastCalledWith({ animated: false, offset: 350 });
  });

  it('stops restoring once the user starts scrolling', () => {
    const { rerender, result, scrollToOffset } = setup({
      columns: 3,
      itemCount: 60,
      rowStride: 100,
    });
    userScroll(result, 1500);
    rerender({ columns: 6, itemCount: 60, rowStride: 50 });
    result.current.scrollProps.onContentSizeChange?.(400, 300);

    result.current.scrollProps.onScrollBeginDrag?.(scrollEvent(120));
    result.current.scrollProps.onContentSizeChange?.(400, 900);

    expect(scrollToOffset).toHaveBeenCalledTimes(1);
  });

  it('clamps to the last row when the anchor is past the end of the data', () => {
    const { rerender, result, scrollToOffset } = setup({
      columns: 3,
      itemCount: 60,
      rowStride: 100,
    });
    userScroll(result, 1900);
    // The data shrank to 10 items, which is two rows at 6 columns.
    rerender({ columns: 6, itemCount: 10, rowStride: 50 });
    result.current.scrollProps.onContentSizeChange?.(400, 900);

    expect(scrollToOffset).toHaveBeenCalledWith({ animated: false, offset: 50 });
  });

  // iOS reports a momentum end for the programmatic restore. Tracking it re-rounded the anchor
  // from item 39 to item 36, landing one row early on the way back.
  it('ignores momentum that does not follow a drag', () => {
    const { rerender, result, scrollToOffset } = setup({
      columns: 3,
      itemCount: 60,
      rowStride: 100,
    });
    userScroll(result, 1300);

    rerender({ columns: 6, itemCount: 60, rowStride: 50 });
    result.current.scrollProps.onContentSizeChange?.(400, 3000);
    result.current.scrollProps.onScroll?.(scrollEvent(300));
    result.current.scrollProps.onMomentumScrollBegin?.(scrollEvent(300));
    result.current.scrollProps.onMomentumScrollEnd?.(scrollEvent(300));

    rerender({ columns: 3, itemCount: 60, rowStride: 100 });
    result.current.scrollProps.onContentSizeChange?.(400, 6000);

    // Item 39 is in row 13 at 3 columns; re-tracking at 6 columns would have given row 12.
    expect(scrollToOffset).toHaveBeenLastCalledWith({ animated: false, offset: 1300 });
  });

  it('survives a round trip back to the original column count', () => {
    const { rerender, result, scrollToOffset } = setup({
      columns: 3,
      itemCount: 60,
      rowStride: 100,
    });
    userScroll(result, 1200);

    rerender({ columns: 6, itemCount: 60, rowStride: 50 });
    result.current.scrollProps.onContentSizeChange?.(400, 3000);
    // Its own restore and the clamp on the way back are not the user scrolling.
    result.current.scrollProps.onScroll?.(scrollEvent(300));
    result.current.scrollProps.onScroll?.(scrollEvent(40));

    rerender({ columns: 3, itemCount: 60, rowStride: 100 });
    result.current.scrollProps.onContentSizeChange?.(400, 6000);

    expect(scrollToOffset).toHaveBeenLastCalledWith({ animated: false, offset: 1200 });
  });

  it('calls the consumer handlers it wraps', () => {
    const onScroll = jest.fn();
    const onScrollBeginDrag = jest.fn();
    const onMomentumScrollEnd = jest.fn();
    const onContentSizeChange = jest.fn();
    const { result } = setup({
      columns: 3,
      itemCount: 60,
      listProps: { onContentSizeChange, onMomentumScrollEnd, onScroll, onScrollBeginDrag },
      rowStride: 100,
    });

    userScroll(result, 100);
    result.current.scrollProps.onMomentumScrollEnd?.(scrollEvent(100));
    result.current.scrollProps.onContentSizeChange?.(390, 800);

    expect(onScrollBeginDrag).toHaveBeenCalledTimes(1);
    expect(onScroll).toHaveBeenCalledTimes(1);
    expect(onMomentumScrollEnd).toHaveBeenCalledTimes(1);
    expect(onContentSizeChange).toHaveBeenCalledWith(390, 800);
  });
});
