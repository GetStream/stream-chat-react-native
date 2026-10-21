import type { Attachment } from 'stream-chat';

import { buildThumbnail } from './buildThumbnail';
import type { GallerySizeAndThumbnailGrid, GallerySizeConfig, ThumbnailGrid } from './types';

import { ChatConfigContextValue } from '../../../../contexts/chatConfigContext/ChatConfigContext';

/**
 * Builds the thumbnail grid for image attachments, sized to `gridWidth` x `gridHeight`.
 *
 * Each inner array of `grid` is a column of thumbnails stacked top to bottom, sized by flex weight:
 * `[[2, 1]]` is one column whose first thumbnail is twice as tall as the second. With
 * `invertedDirections` each inner array is a row, laid out left to right instead.
 *
 * @param params.grid Flex weight of every thumbnail, per column (per row when inverted).
 * @param params.images Image attachments, consumed in grid order.
 * @param params.invertedDirections Swaps the roles of columns and rows. Defaults to false.
 * @param params.resizableCDNHosts CDN hosts whose image URLs can be resized.
 * @param params.sizeConfig Overall gallery size; only `gridHeight` and `gridWidth` are read here.
 * @returns The grid size, its thumbnails and the `invertedDirections` it was built with.
 */
export function buildThumbnailGrid({
  grid,
  images,
  invertedDirections = false,
  resizableCDNHosts,
  sizeConfig,
}: Pick<ChatConfigContextValue, 'resizableCDNHosts'> & {
  grid: number[][];
  images: Attachment[];
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
        flex: flexValue,
        height: tHeight,
        image: currentImage,
        resizableCDNHosts,
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
