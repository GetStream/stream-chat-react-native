import type { Attachment } from 'stream-chat';

import { buildThumbnailGrid } from './buildThumbnailGrid';

import type { GallerySizeAndThumbnailGrid, GallerySizeConfig } from './types';

import type { DefaultAttachmentType } from '../../../../types/types';
import { getAspectRatio } from '../getAspectRatio';

/** function to move item to the front of the array */
function moveToFront<T>(array: T[], item: T): T[] {
  const index = array.indexOf(item);
  if (index === -1) {
    return array;
  }
  const newArray = [...array];
  newArray.splice(index, 1);
  newArray.unshift(item);
  return newArray;
}

export function buildGalleryOfThreeImages<
  At extends DefaultAttachmentType = DefaultAttachmentType,
>({
  images,
  sizeConfig,
}: {
  images: Attachment<At>[];
  sizeConfig: GallerySizeConfig;
}): GallerySizeAndThumbnailGrid {
  // Find the most ladscape and most portrait image.
  const { landscapeImage, landscapeImageAspectRatio, portraitImage, portraitImageAspectRatio } =
    images.reduce(
      (acc, image) => {
        const aspectRatio = getAspectRatio(image);
        const o = { ...acc };

        // Following nested if conditions can be combined, but have been kept
        // separate intentionally for the sake of readability.
        if (aspectRatio > 1) {
          if (!o.landscapeImage || aspectRatio > o.landscapeImageAspectRatio) {
            o.landscapeImage = image;
            o.landscapeImageAspectRatio = aspectRatio;
          }
        } else {
          if (!o.portraitImage || aspectRatio < o.portraitImageAspectRatio) {
            o.portraitImage = image;
            o.portraitImageAspectRatio = aspectRatio;
          }
        }

        return o;
      },
      {
        landscapeImageAspectRatio: 1,
        portraitImageAspectRatio: 1,
      } as {
        landscapeImage: Attachment<At>;
        landscapeImageAspectRatio: number;
        portraitImage: Attachment<At>;
        portraitImageAspectRatio: number;
      },
    );

  // Check weather landscape image gets preference or portrait, by comparing aspect ratio.
  if (landscapeImageAspectRatio > 1 / portraitImageAspectRatio) {
    /**
     * -----------
     * |         |
     * |         |
     * |---------|
     * |    |    |
     * |    |    |
     * -----------
     */
    return buildThumbnailGrid({
      grid: [[1], [1, 1]],
      images: landscapeImage ? moveToFront(images, landscapeImage) : images,
      invertedDirections: true,
      sizeConfig,
    });
  } else {
    /**
     * -----------
     * |    |    |
     * |    |    |
     * |    |----|
     * |    |    |
     * |    |    |
     * -----------
     */
    return buildThumbnailGrid({
      grid: [[1], [1, 1]],
      images: portraitImage ? moveToFront(images, portraitImage) : images,
      invertedDirections: false,
      sizeConfig,
    });
  }
}
