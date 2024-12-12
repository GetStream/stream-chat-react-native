import type { ImageResizeMode } from 'react-native';

import type { Attachment } from 'stream-chat';

import type { Thumbnail } from './types';

import { ChatConfigContextValue } from '../../../../contexts/chatConfigContext/ChatConfigContext';
import type { DefaultStreamChatGenerics } from '../../../../types/types';

import { getResizedImageUrl } from '../../../../utils/getResizedImageUrl';
import { getUrlOfImageAttachment } from '../../../../utils/getUrlOfImageAttachment';

export type BuildThumbnailProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ChatConfigContextValue, 'resizableCDNHosts'> & {
  height: number;
  image: Attachment<StreamChatGenerics>;
  width: number;
  resizeMode?: ImageResizeMode;
};

export function buildThumbnail<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  height,
  image,
  resizableCDNHosts,
  resizeMode,
  width,
}: BuildThumbnailProps<StreamChatGenerics>): Thumbnail {
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
    thumb_url: image.thumb_url,
    type: image.type,
    url: shouldResize
      ? getResizedImageUrl({
          height,
          resizableCDNHosts,
          url: imageUrl,
          width,
        })
      : imageUrl,
    width,
  };
}
