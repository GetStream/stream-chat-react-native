import type { Attachment } from 'stream-chat';

import { buildGalleryOfSingleImage } from './buildGalleryOfSingleImage';
import { buildGalleryOfThreeImages } from './buildGalleryOfThreeImages';
import { buildGalleryOfTwoImages } from './buildGalleryOfTwoImages';

import { buildThumbnailGrid } from './buildThumbnailGrid';

import type { GallerySizeAndThumbnailGrid, GallerySizeConfig } from './types';

import type { DefaultStreamChatGenerics } from '../../../../types/types';

/**
 * Builds and returns a gallery of optimized images to be rendered on UI.
 * This function take a object parameter with following properties:
 *
 * @param {Attachment[]} images - Array of image attachments
 * @param {GallerySizeConfig} sizeConfig - Theme config for the gallery
 *
 * The returned object contains following properties:
 *
 * - height {number[]} - Height of the gallery
 * - width {number[]} - Width of the gallery
 * - thumbnailGrid {number[][]} - Grid of thumbnail images
 * - invertedDirections {boolean} - Whether to invert the direction of the grid. By default grid is rendered with column as primary direction and row as secondary direction.
 *
 * @return {GallerySizeAndThumbnailGrid}
 */
export function buildGallery<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  images,
  resizableCDNHosts,
  sizeConfig,
}: {
  images: Attachment<StreamChatGenerics>[];
  sizeConfig: GallerySizeConfig;
  resizableCDNHosts?: string[];
}): GallerySizeAndThumbnailGrid {
  if (images.length === 1) {
    return buildGalleryOfSingleImage({
      image: images[0],
      resizableCDNHosts,
      sizeConfig,
    });
  }

  if (images.length === 2) {
    return buildGalleryOfTwoImages({
      images,
      sizeConfig,
    });
  }

  if (images.length === 3) {
    return buildGalleryOfThreeImages({
      images,
      sizeConfig,
    });
  }

  /**
   * -----------
   * |    |    |
   * |    |    |
   * -----------
   * |    |    |
   * |    |    |
   * -----------
   */
  return buildThumbnailGrid({
    grid: [
      [1, 1],
      [1, 1],
    ],
    images: images.slice(0, 4),
    invertedDirections: true,
    resizableCDNHosts,
    sizeConfig,
  });
}
