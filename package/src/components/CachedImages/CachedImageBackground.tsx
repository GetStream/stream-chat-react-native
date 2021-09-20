import React from 'react';
import { ImageBackground, ImageBackgroundProps, ImageURISource } from 'react-native';

import { useCachedAttachment } from './useCachedAttachment';

type GalleryImageCacheConfig = {
  channelId: string | undefined;
  messageId: string | undefined;
};

export const CachedImageBackground: React.FC<
  Omit<ImageBackgroundProps, 'source'> & {
    cacheConfig: GalleryImageCacheConfig;
    source: ImageURISource;
  }
> = (props) => {
  const { cacheConfig, source } = props;
  const cachedSource = useCachedAttachment({ cacheConfig, source });

  return cachedSource.uri ? <ImageBackground {...props} source={cachedSource} /> : null;
};
