import { PixelRatio } from 'react-native';

import type { Attachment } from 'stream-chat';

import type { DefaultAttachmentType } from '../types/types';

type GetResizedImageUrlParams<At extends DefaultAttachmentType> = {
  height: number;
  image: Attachment<At>;
  width: number;
};

export function getResizedImageUrl<At extends DefaultAttachmentType>({
  height,
  image,
  width,
}: GetResizedImageUrlParams<At>) {
  const { height: originalImageHeight, width: originalImageWidth } = image;
  const url = (image.image_url || image.thumb_url) as string;

  if (
    originalImageHeight &&
    originalImageWidth &&
    height &&
    width &&
    originalImageHeight + originalImageWidth < height + width
  ) {
    return url;
  }

  let resizedUrl = url;

  if (url.includes('&h=*')) {
    resizedUrl = resizedUrl.replace(
      'h=*',
      `h=${PixelRatio.getPixelSizeForLayoutSize(Number(height))}`,
    );
  }

  if (url.includes('&w=*')) {
    resizedUrl = resizedUrl.replace(
      'w=*',
      `w=${PixelRatio.getPixelSizeForLayoutSize(Number(width))}`,
    );
  }

  if (url.includes('&resize=*')) {
    resizedUrl = resizedUrl.replace('resize=*', `resize=clip`);
  }

  return resizedUrl;
}
