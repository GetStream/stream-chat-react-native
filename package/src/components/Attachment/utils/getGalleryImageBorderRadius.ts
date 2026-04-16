import type { GallerySizeConfig } from './buildGallery/types';

import { primitives } from '../../../theme';

export type GalleryImageBorderRadius = {
  borderBottomLeftRadius: number;
  borderBottomRightRadius: number;
  borderTopLeftRadius: number;
  borderTopRightRadius: number;
};

type Params = {
  colIndex: number;
  numOfColumns: number;
  numOfRows: number;
  rowIndex: number;
  sizeConfig: GallerySizeConfig;
  height?: number;
  invertedDirections?: boolean;
  width?: number;
  messageHasOnlyOneMedia?: boolean;
};

export function getGalleryImageBorderRadius({
  colIndex,
  height,
  invertedDirections,
  numOfColumns,
  numOfRows,
  rowIndex,
  sizeConfig,
  width,
  messageHasOnlyOneMedia = false,
}: Params) {
  const isSingleImage = numOfColumns === 1 && numOfRows === 1;
  const isImageSmallerThanMinContainerSize =
    isSingleImage &&
    height &&
    width &&
    ((height > width && width === sizeConfig.minWidth) ||
      (height < width && height === sizeConfig.minHeight));
  const topLeftEdgeExposed = colIndex === 0 && rowIndex === 0;
  const bottomLeftEdgeExposed =
    (!invertedDirections && colIndex === 0 && rowIndex === numOfRows - 1) ||
    (invertedDirections && colIndex === numOfColumns - 1 && rowIndex === 0);
  const topRightEdgeExposed =
    (!invertedDirections && colIndex === numOfColumns - 1 && rowIndex === 0) ||
    (invertedDirections && colIndex === 0 && rowIndex === numOfRows - 1);
  const bottomRightEdgeExposed = colIndex === numOfColumns - 1 && rowIndex === numOfRows - 1;

  return {
    borderTopLeftRadius: !isImageSmallerThanMinContainerSize && topLeftEdgeExposed ? 12 : 8,
    borderTopRightRadius: !isImageSmallerThanMinContainerSize && topRightEdgeExposed ? 12 : 8,
    borderBottomLeftRadius: messageHasOnlyOneMedia
      ? primitives.radiusNone
      : !isImageSmallerThanMinContainerSize && bottomLeftEdgeExposed
        ? primitives.radiusLg
        : primitives.radiusMd,
    borderBottomRightRadius: messageHasOnlyOneMedia
      ? primitives.radiusNone
      : !isImageSmallerThanMinContainerSize && bottomRightEdgeExposed
        ? primitives.radiusLg
        : primitives.radiusMd,
  };
}
