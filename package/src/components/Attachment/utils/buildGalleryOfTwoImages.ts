import type { Attachment } from 'stream-chat';

import { buildThumbnailGrid } from './buildThumbnailGrid';
import type { GallerySizeAndThumbnailGrid, GallerySizeConfig } from './types';

import type { DefaultAttachmentType } from '../../../types/types';

export function buildGalleryOfTwoImages<At extends DefaultAttachmentType>({
  images,
  sizeConfig,
}: {
  images: Attachment<At>[];
  sizeConfig: GallerySizeConfig;
}): GallerySizeAndThumbnailGrid {
  const { defaultHeight, defaultWidth } = sizeConfig;

  const image1Height = images[0].height || defaultHeight;
  const image1Width = images[0].width || defaultWidth;
  const image2Height = images[1].height || defaultHeight;
  const image2Width = images[1].width || defaultWidth;

  const aspectRatio1 = image1Width / image1Height;
  const aspectRatio2 = image2Width / image2Height;

  // check if one image is landscape and other is portrait or vice versa
  const isLandscape1 = aspectRatio1 > 1;
  const isLandscape2 = aspectRatio2 > 1;

  // Both the images are landscape
  if (isLandscape1 && isLandscape2) {
    return buildThumbnailGrid({
      grid: [[1], [1]],
      images,
      invertedDirections: true,
      sizeConfig,
    });
  }

  if (!isLandscape1 && !isLandscape2) {
    return buildThumbnailGrid({
      grid: [[1], [1]],
      images,
      invertedDirections: false,
      sizeConfig,
    });
  }

  return buildThumbnailGrid({
    grid: [[2, 1]],
    images: isLandscape1 ? images : images.reverse(),
    invertedDirections: true,
    sizeConfig,
  });
}
