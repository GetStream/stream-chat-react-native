import { renderHook } from '@testing-library/react-native';

import { useAttachmentPickerBottomSheet } from '../useAttachmentPickerBottomSheet';

describe('useAttachmentPickerBottomSheet', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('opens the sheet at its first snap point', () => {
    const snapToIndex = jest.fn();
    const { result } = renderHook(() => useAttachmentPickerBottomSheet());

    result.current.openPicker({ current: { snapToIndex } as never });

    expect(snapToIndex).toHaveBeenCalledWith(0);
  });

  it('warns that the sheet cannot open when the ref has no snapToIndex', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() => useAttachmentPickerBottomSheet());

    result.current.openPicker({ current: null });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('snapToIndex'));
  });
});
