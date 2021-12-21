import type { Attachment } from 'stream-chat';

import { buildThumbnail } from './buildThumbnail';
import type { GallerySizeAndThumbnailGrid, GallerySizeConfig, ThumbnailGrid } from './types';

import type { DefaultAttachmentType } from '../../../../types/types';

/**
 * Builds a grid of thumbnail images from image attachments.
 * This function take a object parameter with following properties:
 *
 * - {number[][]} grid - Grid pattern of the gallery. Each numeric value in the array represents the flex value of corresponding image in grid.
 * - {Attachment[]} images - Array of image attachments.
 * - {GallerySizeConfig} sizeConfig - Theme config for the gallery.
 * - {boolean} invertedDirections - Whether to invert the direction of the grid. By default grid is rendered with column as primary direction and row as secondary direction.
 *
 * @return {GallerySizeAndThumbnailGrid}
 */
export function buildThumbnailGrid<At extends DefaultAttachmentType = DefaultAttachmentType>({
  grid,
  images,
  invertedDirections = false,
  sizeConfig,
}: {
  grid: number[][];
  images: Attachment<At>[];
  invertedDirections: boolean;
  sizeConfig: GallerySizeConfig;
}): GallerySizeAndThumbnailGrid {
  const { gridHeight, gridWidth } = sizeConfig;

  let imageIndex = 0;
  const thumbnailGrid: ThumbnailGrid = [];
  const numOfColumns = grid.length;
  grid.forEach((rows, colIndex) => {
    const totalFlexValue = rows.reduce((acc, curr) => acc + curr, 0);

    rows.forEach((flexValue) => {
      const tHeight = invertedDirections
        ? gridHeight / numOfColumns
        : gridHeight * (flexValue / totalFlexValue);

      const tWidth = invertedDirections
        ? gridWidth * (flexValue / totalFlexValue)
        : gridWidth / numOfColumns;

      const currentImage = images[imageIndex];
      const thumbnail = buildThumbnail({
        height: tHeight,
        image: currentImage,
        resizeMode: 'cover',
        width: tWidth,
      });

      if (!thumbnailGrid[colIndex]) {
        thumbnailGrid[colIndex] = [];
      }

      thumbnailGrid[colIndex].push(thumbnail);
      imageIndex++;
    });
  });
  return {
    height: gridHeight,
    invertedDirections,
    thumbnailGrid,
    width: gridWidth,
  };
}
