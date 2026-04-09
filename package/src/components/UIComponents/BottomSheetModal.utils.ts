export const BOTTOM_SHEET_HANDLE_HEIGHT = 4;
export const BOTTOM_SHEET_HANDLE_MARGIN_VERTICAL = 8;
export const BOTTOM_SHEET_HANDLE_TOTAL_HEIGHT =
  BOTTOM_SHEET_HANDLE_HEIGHT + BOTTOM_SHEET_HANDLE_MARGIN_VERTICAL * 2;

type GetBottomSheetBaseHeightParams = {
  bottomInset: number;
  contentHeight: number | null;
  enableDynamicSizing: boolean;
  height: number;
  maxHeight: number;
};

export const getBottomSheetBaseHeight = ({
  bottomInset,
  contentHeight,
  enableDynamicSizing,
  height,
  maxHeight,
}: GetBottomSheetBaseHeightParams) => {
  const cappedHeight = Math.min(height, maxHeight);

  if (!enableDynamicSizing || contentHeight === null) {
    return cappedHeight;
  }

  const measuredHeight =
    Math.max(0, contentHeight) + BOTTOM_SHEET_HANDLE_TOTAL_HEIGHT + bottomInset;

  return Math.min(measuredHeight, cappedHeight);
};

type GetBottomSheetSnapPointsParams = {
  baseHeight: number;
  maxHeight: number;
};

export const getBottomSheetSnapPoints = ({
  baseHeight,
  maxHeight,
}: GetBottomSheetSnapPointsParams) => {
  if (baseHeight === maxHeight) {
    return [baseHeight];
  }

  return [baseHeight, maxHeight];
};
