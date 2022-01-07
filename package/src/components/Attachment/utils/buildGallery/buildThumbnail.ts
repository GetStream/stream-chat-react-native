import type { ImageResizeMode } from 'react-native';

import type { Attachment } from 'stream-chat';

import type { Thumbnail } from './types';

import type { DefaultAttachmentType, UnknownType } from '../../../../types/types';

import { getResizedImageUrl } from '../../../../utils/getResizedImageUrl';
import { getUrlOfImageAttachment } from '../../../../utils/getUrlOfImageAttachment';

export function buildThumbnail<At extends UnknownType = DefaultAttachmentType>({
  height,
  image,
  resizeMode,
  width,
}: {
  height: number;
  image: Attachment<At>;
  width: number;
  resizeMode?: ImageResizeMode;
}): Thumbnail {
  const { original_height: originalImageHeight, original_width: originalImageWidth } = image;

  // Only resize if the original image is larger than the thumbnail container size.
  const shouldResize =
    originalImageHeight && originalImageWidth
      ? originalImageHeight + originalImageWidth > height + width
      : true;
  const imageUrl = getUrlOfImageAttachment(image) as string;

  return {
    height,
    resizeMode: resizeMode
      ? resizeMode
      : ((image.original_height && image.original_width ? 'contain' : 'cover') as ImageResizeMode),
    url: shouldResize
      ? getResizedImageUrl({
          height,
          url: imageUrl,
          width,
        })
      : imageUrl,
    width,
  };
}
