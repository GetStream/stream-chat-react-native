import React from 'react';
import { Image, ImageProps, ImageURISource } from 'react-native';

import { useCachedAttachment } from './useCachedAttachment';

type GalleryImageCacheConfig = {
  channelId: string | undefined;
  messageId: string | undefined;
};

export const CachedAttachmentImage: React.FC<
  Omit<ImageProps, 'source'> & {
    cacheConfig: GalleryImageCacheConfig;
    source: ImageURISource;
  }
> = (props) => {
  const { cacheConfig, source } = props;
  const cachedSource = useCachedAttachment({ cacheConfig, source });

  return cachedSource.uri ? <Image {...props} source={cachedSource} /> : null;
};
