import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import { renderHook } from '@testing-library/react-native';

import { useGridScrollAnchor } from '../../navigation-section/useGridScrollAnchor';

const scrollEvent = (y: number, viewport = { height: 800, width: 390 }) =>
  ({
    nativeEvent: { contentOffset: { x: 0, y }, layoutMeasurement: viewport },
  }) as NativeSyntheticEvent<NativeScrollEvent>;

type Props = { columns: number; itemCount: number; rowStride: number };

const setup = (initialProps: Props) => {
  const hook = renderHook((props: Props) => useGridScrollAnchor(props), { initialProps });
  const scrollToOffset = jest.fn();
  const attachList = () => {
    (hook.result.current.listRef as { current: unknown }).current = { scrollToOffset };
  };
  attachList();
  return { ...hook, attachList, scrollToOffset };
};

describe('useGridScrollAnchor', () => {
  it('scrolls the remounted list back to the row holding the first visible item', () => {
    // 3 columns, 100pt rows: an offset of 450 puts row 4 (items 12-14) first.
    const { attachList, rerender, result, scrollToOffset } = setup({
      columns: 3,
      itemCount: 60,
      rowStride: 100,
    });
    result.current.onScroll(scrollEvent(450));

    // Rotating to 6 columns of 50pt rows: item 12 is now in row 2.
    rerender({ columns: 6, itemCount: 60, rowStride: 50 });
    attachList();
    result.current.onContentSizeChange(400, 500);

    expect(scrollToOffset).toHaveBeenCalledWith({ animated: false, offset: 100 });
  });

  it('does nothing on the first mount', () => {
    const { result, scrollToOffset } = setup({ columns: 3, itemCount: 60, rowStride: 100 });
    result.current.onScroll(scrollEvent(450));
    result.current.onContentSizeChange(400, 5000);

    expect(scrollToOffset).not.toHaveBeenCalled();
  });

  it('ignores the remounted list scrolling from the top before it has been restored', () => {
    const { attachList, rerender, result, scrollToOffset } = setup({
      columns: 3,
      itemCount: 60,
      rowStride: 100,
    });
    result.current.onScroll(scrollEvent(450));
    rerender({ columns: 6, itemCount: 60, rowStride: 50 });
    attachList();

    result.current.onScroll(scrollEvent(0));
    result.current.onContentSizeChange(400, 500);

    expect(scrollToOffset).toHaveBeenCalledWith({ animated: false, offset: 100 });
  });

  it('waits until the content is tall enough to reach the target row', () => {
    const { attachList, rerender, result, scrollToOffset } = setup({
      columns: 3,
      itemCount: 60,
      rowStride: 100,
    });
    result.current.onScroll(scrollEvent(1500));
    rerender({ columns: 6, itemCount: 60, rowStride: 50 });
    attachList();

    // Item 45 lands in row 7, at 350pt.
    result.current.onContentSizeChange(400, 300);
    expect(scrollToOffset).not.toHaveBeenCalled();

    result.current.onContentSizeChange(400, 900);
    expect(scrollToOffset).toHaveBeenCalledWith({ animated: false, offset: 350 });
  });

  it('clamps to the last row when the anchor is past the end of the data', () => {
    const { attachList, rerender, result, scrollToOffset } = setup({
      columns: 3,
      itemCount: 60,
      rowStride: 100,
    });
    result.current.onScroll(scrollEvent(1900));
    // The data shrank to 10 items, which is two rows at 6 columns.
    rerender({ columns: 6, itemCount: 10, rowStride: 50 });
    attachList();
    result.current.onContentSizeChange(400, 900);

    expect(scrollToOffset).toHaveBeenCalledWith({ animated: false, offset: 50 });
  });

  // Rotating to a taller viewport over shorter content makes iOS clamp the offset before the
  // grid re-lays out. That clamp arrives as a scroll event and must not move the anchor.
  it('ignores an offset clamped by a viewport resize', () => {
    const { attachList, rerender, result, scrollToOffset } = setup({
      columns: 3,
      itemCount: 60,
      rowStride: 100,
    });
    result.current.onScroll(scrollEvent(450));
    result.current.onScroll(scrollEvent(120, { height: 350, width: 830 }));

    rerender({ columns: 6, itemCount: 60, rowStride: 50 });
    attachList();
    result.current.onContentSizeChange(400, 500);

    expect(scrollToOffset).toHaveBeenCalledWith({ animated: false, offset: 100 });
  });

  it('keeps tracking scrolling after a resize', () => {
    const { attachList, rerender, result, scrollToOffset } = setup({
      columns: 3,
      itemCount: 60,
      rowStride: 100,
    });
    result.current.onScroll(scrollEvent(120, { height: 350, width: 830 }));
    result.current.onScroll(scrollEvent(450, { height: 350, width: 830 }));

    rerender({ columns: 6, itemCount: 60, rowStride: 50 });
    attachList();
    result.current.onContentSizeChange(400, 500);

    expect(scrollToOffset).toHaveBeenCalledWith({ animated: false, offset: 100 });
  });

  it('restores once per column change, then tracks scrolling again', () => {
    const { attachList, rerender, result, scrollToOffset } = setup({
      columns: 3,
      itemCount: 60,
      rowStride: 100,
    });
    result.current.onScroll(scrollEvent(450));
    rerender({ columns: 6, itemCount: 60, rowStride: 50 });
    attachList();
    result.current.onContentSizeChange(400, 500);
    result.current.onContentSizeChange(400, 3000);
    expect(scrollToOffset).toHaveBeenCalledTimes(1);

    // Scrolled to row 10 at 6 columns (item 60 clamps to the last row of 60 items at 3 columns).
    result.current.onScroll(scrollEvent(500));
    rerender({ columns: 3, itemCount: 60, rowStride: 100 });
    attachList();
    result.current.onContentSizeChange(400, 6000);
    expect(scrollToOffset).toHaveBeenLastCalledWith({ animated: false, offset: 1900 });
  });
});
