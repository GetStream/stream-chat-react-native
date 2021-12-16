import type { Attachment } from 'stream-chat';
import type { DefaultAttachmentType } from '../../../types/types';

import { buildGalleryOfSingleImage } from './buildGalleryOfSingleImage';
import { buildGalleryOfThreeImages } from './buildGalleryOfThreeImages';
import { buildGalleryOfTwoImages } from './buildGalleryOfTwoImages';
import type { GallerySizeAndThumbnailGrid, GallerySizeConfig } from './types';
import { buildThumbnailGrid } from './buildThumbnailGrid';

export function getGallery<At extends DefaultAttachmentType>({
  images,
  sizeConfig,
}: {
  images: Attachment<At>[];
  sizeConfig: GallerySizeConfig;
}): GallerySizeAndThumbnailGrid {
  if (images.length === 1) {
    return buildGalleryOfSingleImage({
      image: images[0],
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

  return buildThumbnailGrid({
    grid: [
      [1, 1],
      [1, 1],
    ],
    images: images.slice(0, 4),
    invertedDirections: false,
    sizeConfig,
  });
}
