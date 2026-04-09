import {
  BOTTOM_SHEET_HANDLE_TOTAL_HEIGHT,
  getBottomSheetBaseHeight,
  getBottomSheetSnapPointTranslateY,
  getBottomSheetSnapPoints,
  getBottomSheetTopSnapIndex,
} from '../BottomSheetModal.utils';

describe('BottomSheetModal.utils', () => {
  it('caps fixed bottom sheet height by maxHeight', () => {
    expect(
      getBottomSheetBaseHeight({
        contentHeight: undefined,
        enableDynamicSizing: false,
        height: 500,
        maxHeight: 420,
      }),
    ).toBe(420);
  });

  it('uses measured content height plus handle and safe area when dynamic sizing is enabled', () => {
    expect(
      getBottomSheetBaseHeight({
        contentHeight: 120,
        enableDynamicSizing: true,
        height: 400,
        maxHeight: 500,
      }),
    ).toBe(120 + BOTTOM_SHEET_HANDLE_TOTAL_HEIGHT);
  });

  it('caps dynamic content height by the provided height', () => {
    expect(
      getBottomSheetBaseHeight({
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

  it('returns the correct top snap index', () => {
    expect(
      getBottomSheetTopSnapIndex({
        baseHeight: 280,
        maxHeight: 640,
      }),
    ).toBe(1);

    expect(
      getBottomSheetTopSnapIndex({
        baseHeight: 640,
        maxHeight: 640,
      }),
    ).toBe(0);
  });

  it('returns the correct translateY for each snap point', () => {
    expect(
      getBottomSheetSnapPointTranslateY({
        baseHeight: 280,
        maxHeight: 640,
        snapIndex: 0,
      }),
    ).toBe(360);

    expect(
      getBottomSheetSnapPointTranslateY({
        baseHeight: 280,
        maxHeight: 640,
        snapIndex: 1,
      }),
    ).toBe(0);

    expect(
      getBottomSheetSnapPointTranslateY({
        baseHeight: 640,
        maxHeight: 640,
        snapIndex: 0,
      }),
    ).toBe(0);
  });
});
