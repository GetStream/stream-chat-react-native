export const BOTTOM_SHEET_HANDLE_HEIGHT = 4;
export const BOTTOM_SHEET_HANDLE_MARGIN_VERTICAL = 8;
export const BOTTOM_SHEET_HANDLE_TOTAL_HEIGHT =
  BOTTOM_SHEET_HANDLE_HEIGHT + BOTTOM_SHEET_HANDLE_MARGIN_VERTICAL * 2;

type GetBottomSheetBaseHeightParams = {
  contentHeight: number | undefined;
  enableDynamicSizing: boolean;
  height: number;
  maxHeight: number;
};

export const getBottomSheetBaseHeight = ({
  contentHeight,
  enableDynamicSizing,
  height,
  maxHeight,
}: GetBottomSheetBaseHeightParams) => {
  'worklet';

  const cappedHeight = Math.min(height, maxHeight);

  if (!enableDynamicSizing || contentHeight === undefined) {
    return cappedHeight;
  }

  const measuredHeight = Math.max(0, contentHeight) + BOTTOM_SHEET_HANDLE_TOTAL_HEIGHT;

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
  'worklet';

  if (baseHeight === maxHeight) {
    return [baseHeight];
  }

  return [baseHeight, maxHeight];
};

type GetBottomSheetTopSnapIndexParams = {
  baseHeight: number;
  maxHeight: number;
};

export const getBottomSheetTopSnapIndex = ({
  baseHeight,
  maxHeight,
}: GetBottomSheetTopSnapIndexParams) => {
  'worklet';

  return baseHeight === maxHeight ? 0 : 1;
};

type GetBottomSheetSnapPointTranslateYParams = {
  baseHeight: number;
  maxHeight: number;
  snapIndex: number;
};

export const getBottomSheetSnapPointTranslateY = ({
  baseHeight,
  maxHeight,
  snapIndex,
}: GetBottomSheetSnapPointTranslateYParams) => {
  'worklet';

  if (getBottomSheetTopSnapIndex({ baseHeight, maxHeight }) === 0) {
    return 0;
  }

  return snapIndex <= 0 ? maxHeight - baseHeight : 0;
};
