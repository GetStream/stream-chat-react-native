import type { Attachment } from 'stream-chat';

import { buildThumbnail } from './buildThumbnail';
import type { GallerySizeAndThumbnailGrid, GallerySizeConfig } from './types';

import type { DefaultAttachmentType } from '../../../types/types';

function limitNumberWithinRange(number: number, min: number, max: number) {
  return Math.min(Math.max(number, min), max);
}

export function getContainerSizeOfSingleImage<At extends DefaultAttachmentType>({
  image,
  sizeConfig,
}: {
  image: Attachment<At>;
  sizeConfig: GallerySizeConfig;
}) {
  const { height, width } = image;
  const { defaultHeight, defaultWidth, maxHeight, maxWidth, minHeight, minWidth } = sizeConfig;

  if (!height || !width) {
    return { height: defaultHeight, width: defaultWidth };
  }

  const aspectRatio = height / width;
  if (aspectRatio > 1) {
    const containerHeight = limitNumberWithinRange(height, minHeight, maxHeight);
    const containerWidth = limitNumberWithinRange(
      containerHeight / aspectRatio,
      minWidth,
      maxWidth,
    );

    return {
      height: containerHeight,
      width: containerWidth,
    };
  }

  if (aspectRatio <= 1) {
    const containerWidth = limitNumberWithinRange(width, minWidth, maxWidth);
    const containerHeight = limitNumberWithinRange(
      containerWidth * aspectRatio,
      minHeight,
      maxHeight,
    );

    return {
      height: containerHeight,
      width: containerWidth,
    };
  }

  return { height: defaultHeight, width: defaultWidth };
}

export function buildGalleryOfSingleImage<At extends DefaultAttachmentType>({
  image,
  sizeConfig,
}: {
  image: Attachment<At>;
  sizeConfig: GallerySizeConfig;
}): GallerySizeAndThumbnailGrid {
  const container = getContainerSizeOfSingleImage({
    image,
    sizeConfig,
  });

  const thumbnail = buildThumbnail({
    height: container.height,
    image,
    width: container.width,
  });

  const column = [thumbnail];

  return {
    ...container,
    thumbnailGrid: [column],
  };
}
