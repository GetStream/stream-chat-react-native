import type { Attachment } from 'stream-chat';

import { buildThumbnail } from './buildThumbnail';

import type { GallerySizeAndThumbnailGrid, GallerySizeConfig } from './types';

import type { DefaultAttachmentType } from '../../../../types/types';
import { getAspectRatio } from '../getAspectRatio';

/**
 * Bound a number to a range.
 * @param number The number to bound.
 * @param min The minimum value.
 * @param max The maximum value.
 *
 * @returns The bounded number.
 */
function clamp(number: number, min: number, max: number) {
  return Math.min(Math.max(number, min), max);
}

function getContainerSize<At extends DefaultAttachmentType = DefaultAttachmentType>({
  image,
  sizeConfig,
}: {
  image: Attachment<At>;
  sizeConfig: GallerySizeConfig;
}) {
  const { original_height: height, original_width: width } = image;
  const { gridHeight, gridWidth, maxHeight, maxWidth, minHeight, minWidth } = sizeConfig;

  if (!height || !width) {
    return { height: gridHeight, width: gridWidth };
  }

  const aspectRatio = getAspectRatio(image);

  if (aspectRatio <= 1) {
    const containerHeight = clamp(height, minHeight, maxHeight);
    const containerWidth = clamp(containerHeight * aspectRatio, minWidth, maxWidth);

    if (containerWidth === maxWidth) {
      return {
        height: clamp(containerWidth / aspectRatio, minHeight, maxHeight),
        width: containerWidth,
      };
    }
    return {
      height: containerHeight,
      width: containerWidth,
    };
  }

  const containerWidth = clamp(width, minWidth, maxWidth);
  const containerHeight = clamp(containerWidth / aspectRatio, minHeight, maxHeight);

  if (containerHeight === maxHeight) {
    return {
      height: containerHeight,
      width: clamp(containerHeight * aspectRatio, minHeight, maxHeight),
    };
  }

  return {
    height: containerHeight,
    width: containerWidth,
  };
}

export function buildGalleryOfSingleImage<
  At extends DefaultAttachmentType = DefaultAttachmentType,
>({
  image,
  sizeConfig,
}: {
  image: Attachment<At>;
  sizeConfig: GallerySizeConfig;
}): GallerySizeAndThumbnailGrid {
  const container = getContainerSize({
    image,
    sizeConfig,
  });

  const thumbnail = buildThumbnail({
    image,
    ...container,
  });

  const column = [thumbnail];

  return {
    ...container,
    thumbnailGrid: [column],
  };
}
