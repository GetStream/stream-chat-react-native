import { useEffect, useRef, useState } from 'react';

import { StreamCache } from '../../StreamCache';
import StreamMediaCache from '../../StreamMediaCache';

import { extractPathname } from './utils';

import type { ImageURISource } from 'react-native';
import { useNetworkState } from './useNetworkState';

type GalleryImageCacheConfig = {
  channelId: string | undefined;
  messageId: string | undefined;
};

export const useCachedAttachment = (config: {
  cacheConfig: GalleryImageCacheConfig;
  source: ImageURISource;
}) => {
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

    const { channelId, messageId } = config.cacheConfig;
    const pathname = extractPathname(config.source.uri);

    if (!messageId || !config.source.uri || !channelId || !pathname) {
      if (!messageId || !channelId) {
        console.warn(
          "Attempted to use cached attachment without passing the cacheConfig prop to the cached image component. Please make sure you're sending the channelId and messageId",
        );
      }
      return setCachedSource((src) => ({
        ...src,
        uri: config.source.uri as string,
      }));
    }

    if (!(await StreamMediaCache.checkIfLocalAttachment(channelId, messageId, pathname))) {
      await StreamMediaCache.saveAttachment(
        channelId,
        messageId,
        pathname,
        config.source.uri as string,
      );
    }

    if (mountedState.current) {
      setCachedSource((src) => ({
        ...src,
        uri: `file://${StreamMediaCache.getStreamChannelMessageAttachmentDir(
          channelId,
          messageId,
          pathname,
        )}`,
      }));
    }
  };

  useEffect(() => {
    setCachedSourceIfExists();
  }, []);

  return cachedSource;
};
