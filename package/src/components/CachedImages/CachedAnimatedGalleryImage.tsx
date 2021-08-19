import React from 'react';
import Animated from 'react-native-reanimated';

import type { ImageProps, ImageURISource } from 'react-native';

import { useCachedAttachment } from './useCachedAttachment';

type GalleryImageCacheConfig = {
  channelId: string | undefined;
  messageId: string | undefined;
};

export const CachedAnimatedGalleryImage: React.FC<
  Omit<ImageProps, 'source'> & {
    cacheConfig: GalleryImageCacheConfig;
    source: ImageURISource;
  }
> = (props) => {
  const { cacheConfig, source } = props;
  const cachedSource = useCachedAttachment({ cacheConfig, source });

  return cachedSource.uri ? <Animated.Image {...props} source={cachedSource} /> : null;
};
