import {
  BOTTOM_SHEET_HANDLE_TOTAL_HEIGHT,
  getBottomSheetBaseHeight,
  getBottomSheetSnapPoints,
} from '../BottomSheetModal.utils';

describe('BottomSheetModal.utils', () => {
  it('caps fixed bottom sheet height by maxHeight', () => {
    expect(
      getBottomSheetBaseHeight({
        bottomInset: 24,
        contentHeight: null,
        enableDynamicSizing: false,
        height: 500,
        maxHeight: 420,
      }),
    ).toBe(420);
  });

  it('uses measured content height plus handle and safe area when dynamic sizing is enabled', () => {
    expect(
      getBottomSheetBaseHeight({
        bottomInset: 24,
        contentHeight: 120,
        enableDynamicSizing: true,
        height: 400,
        maxHeight: 500,
      }),
    ).toBe(120 + BOTTOM_SHEET_HANDLE_TOTAL_HEIGHT + 24);
  });

  it('caps dynamic content height by the provided height', () => {
    expect(
      getBottomSheetBaseHeight({
        bottomInset: 24,
        contentHeight: 500,
        enableDynamicSizing: true,
        height: 300,
        maxHeight: 600,
      }),
    ).toBe(300);
  });

  it('keeps the expanded snap point when the sheet is shorter than maxHeight', () => {
    expect(
      getBottomSheetSnapPoints({
        baseHeight: 280,
        maxHeight: 640,
      }),
    ).toEqual([280, 640]);
  });

  it('returns two snap points for fixed sizing when maxHeight exceeds baseHeight', () => {
    expect(
      getBottomSheetSnapPoints({
        baseHeight: 280,
        maxHeight: 640,
      }),
    ).toEqual([280, 640]);
  });

  it('returns a single snap point when the sheet is already at maxHeight', () => {
    expect(
      getBottomSheetSnapPoints({
        baseHeight: 640,
        maxHeight: 640,
      }),
    ).toEqual([640]);
  });
});
