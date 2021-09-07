import { useEffect, useState } from 'react';

import { StreamCache } from '../../StreamCache';
import StreamMediaCache from '../../StreamMediaCache';

import type { ImageProps, ImageURISource } from 'react-native';

export const useCachedAvatar = (
  config: Omit<ImageProps, 'source'> & {
    channelId: string | undefined;
    source: ImageURISource;
  },
) => {
  const [cachedSource, setCachedSource] = useState({
    ...config.source,
    uri: !StreamCache.shouldCacheMedia() ? config.source.uri : '',
  });

  const setCachedSourceIfExists = async () => {
    if (!StreamCache.shouldCacheMedia()) return;

    const { channelId } = config;
    const url = config.source.uri;
    const parsedUrl = url?.includes('?') ? url.split('?')[0] : url;

    if (!config.source.uri || !channelId || !parsedUrl) {
      if (!channelId) {
        console.warn(
          'Attempted to use cached avatar without passing the channelId prop to the cached image component. Falling back to network.',
        );
      }
      return setCachedSource((src) => ({
        ...src,
        uri: config.source.uri as string,
      }));
    }

    if (!(await StreamMediaCache.checkIfLocalAvatar(channelId, parsedUrl))) {
      await StreamMediaCache.saveAvatar(channelId, parsedUrl, config.source.uri as string);
    }

    setCachedSource((src) => ({
      ...src,
      uri: `file://${StreamMediaCache.getStreamChannelAvatarDir(channelId, parsedUrl)}`,
    }));
  };

  useEffect(() => {
    setCachedSourceIfExists();
  }, []);

  return cachedSource;
};
