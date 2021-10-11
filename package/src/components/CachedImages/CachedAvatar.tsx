import React from 'react';
import { Image } from 'react-native';
import AvatarPlaceholder from '../Avatar/AvatarPlaceholder';

import type { ImageProps, ImageURISource } from 'react-native';

import { useCachedAvatar } from './useCachedAvatar';

export const CachedAvatar: React.FC<
  Omit<ImageProps, 'source'> & {
    channelId: string | undefined;
    id: string | undefined;
    initials: string;
    source: ImageURISource;
  }
> = (props) => {
  const cachedSource = useCachedAvatar(props);

  return cachedSource.uri ? (
    <Image {...props} source={cachedSource} />
  ) : (
    <AvatarPlaceholder {...props} />
  );
};
