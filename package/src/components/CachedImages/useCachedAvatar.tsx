import { useEffect, useRef, useState } from 'react';

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
  // No need to use the returned value once we are using it to trigger a rerender and
  // force images to load
  useNetworkState(mountedState);
  useEffect(
    () => () => {
      mountedState.current = false;
    },
    [],
  );

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
      setCachedSource((src) => ({
        ...src,
        uri: `file://${StreamMediaCache.getStreamChannelAvatarDir(channelId, pathname)}`,
      }));
    }
  };

  useEffect(() => {
    setCachedSourceIfExists();
  }, []);

  return cachedSource;
};
