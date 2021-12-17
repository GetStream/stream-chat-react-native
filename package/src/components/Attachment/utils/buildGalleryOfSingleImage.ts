import type { Attachment } from 'stream-chat';

import { buildThumbnail } from './buildThumbnail';
import { getAspectRatio } from './getAspectRatio';
import type { GallerySizeAndThumbnailGrid, GallerySizeConfig } from './types';

import type { DefaultAttachmentType } from '../../../types/types';

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
  const { height, width } = image;
  const { gridHeight, gridWidth, maxHeight, maxWidth, minHeight, minWidth } = sizeConfig;

  if (!height || !width) {
    return { height: gridHeight, width: gridWidth };
  }

  const aspectRatio = getAspectRatio(image);

  if (aspectRatio <= 1) {
    const containerHeight = clamp(height, minHeight, maxHeight);
    const containerWidth = clamp(containerHeight * aspectRatio, minWidth, maxWidth);

    return {
      height: containerHeight,
      width: containerWidth,
    };
  }

  const containerWidth = clamp(width, minWidth, maxWidth);
  const containerHeight = clamp(containerWidth / aspectRatio, minHeight, maxHeight);

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
