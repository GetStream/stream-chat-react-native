import React, { useMemo } from 'react';
import { ImageProps } from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import type { FastImageProps } from '@d11/react-native-fast-image';
import { useChatContext } from 'stream-chat-react-native';

type FastImageAdapterProps = Omit<ImageProps, 'source'> &
  Pick<FastImageProps, 'source' | 'transition'>;

export const FastImageAdapter = React.memo((props: ImageProps) => {
  const { isOnline } = useChatContext();
  const {
    source,
    transition = FastImage.transition.fade,
    ...rest
  } = props as FastImageAdapterProps;

  const resolvedSource = useMemo<FastImageProps['source']>(() => {
    if (
      !source ||
      typeof source !== 'object' ||
      Array.isArray(source) ||
      !('uri' in source) ||
      typeof source.uri !== 'string' ||
      !/^https?:\/\//i.test(source.uri)
    ) {
      return source;
    }

    return {
      ...source,
      cache:
        source.cache ??
        (isOnline === false ? FastImage.cacheControl.cacheOnly : FastImage.cacheControl.immutable),
      priority: source.priority ?? FastImage.priority.normal,
    };
  }, [isOnline, source]);

  return (
    <FastImage
      {...(rest as Omit<FastImageProps, 'source' | 'transition'>)}
      source={resolvedSource}
      // transition={transition}
    />
  );
});

FastImageAdapter.displayName = 'FastImageAdapter';
