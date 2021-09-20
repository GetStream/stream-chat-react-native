import React from 'react';
import { Image, ImageProps, ImageURISource } from 'react-native';

import { useCachedAvatar } from './useCachedAvatar';

export const CachedAvatar: React.FC<
  Omit<ImageProps, 'source'> & {
    channelId: string | undefined;
    source: ImageURISource;
  }
> = (props) => {
  const cachedSource = useCachedAvatar(props);

  return cachedSource.uri ? <Image {...props} source={cachedSource} /> : null;
};
