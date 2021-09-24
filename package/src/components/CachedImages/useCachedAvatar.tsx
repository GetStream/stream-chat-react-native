import { useEffect, useRef, useState } from 'react';
import { Image } from 'react-native';

import { StreamCache } from '../../StreamCache';
import StreamMediaCache from '../../StreamMediaCache';

import type { ImageProps, ImageURISource } from 'react-native';

import { extractPathname } from './utils';
import { useNetworkState } from './useNetworkState';

export const useCachedAvatar = (
  config: Omit<ImageProps, 'source'> & {
    channelId: string | undefined;
    source: ImageURISource;
  },
) => {
  // Stores when component gets unmounted so we can avoid calling setState after image promise resolves
  const mountedState = useRef(true);
  const lastOnlineStatus = useNetworkState(mountedState);
  useEffect(() => {
    mountedState.current = true;
    return () => {
      mountedState.current = false;
    };
  }, []);

  const [cachedSource, setCachedSource] = useState({
    ...config.source,
    uri: !StreamCache.shouldCacheMedia() ? config.source.uri : '',
  });

  const setCachedSourceIfExists = async () => {
    if (!StreamCache.shouldCacheMedia()) return;

    const { channelId } = config;
    const url = config.source.uri;
    const pathname = extractPathname(url);

    if (!config.source.uri || !channelId || !pathname) {
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

    if (!(await StreamMediaCache.checkIfLocalAvatar(channelId, pathname))) {
      await StreamMediaCache.saveAvatar(channelId, pathname, config.source.uri as string);
    }

    if (mountedState.current) {
      const uri = `file://${StreamMediaCache.getStreamChannelAvatarDir(channelId, pathname)}`;

      await Image.prefetch(uri);
      setCachedSource((src) => ({
        ...src,
        uri,
      }));
    }
  };

  useEffect(() => {
    setCachedSourceIfExists();
  }, [lastOnlineStatus]);

  return cachedSource;
};
