import type { ImageResizeMode } from 'react-native';

import type { Attachment } from 'stream-chat';

import type { Thumbnail } from './types';

import type { DefaultAttachmentType } from '../../../types/types';

import { getResizedImageUrl } from '../../../utils/getResizedImageUrl';

export function buildThumbnail<At extends DefaultAttachmentType>({
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
  return {
    height,
    resizeMode: resizeMode
      ? resizeMode
      : ((image.height && image.width ? 'contain' : 'cover') as ImageResizeMode),
    url: getResizedImageUrl({
      height,
      image,
      width,
    }),
    width,
  };
}
