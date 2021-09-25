import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Placeholder from './Placeholder';

import { useCachedAttachment } from './useCachedAttachment';

import type { ImageProps, ImageURISource } from 'react-native';

type GalleryImageCacheConfig = {
  channelId: string | undefined;
  messageId: string | undefined;
};

const styles = StyleSheet.create({
  placeholderWrapper: {
    alignItems: 'center',
    backgroundColor: '#E9EAED',
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
});

export const CachedAttachmentImage: React.FC<
  Omit<ImageProps, 'source'> & {
    cacheConfig: GalleryImageCacheConfig;
    source: ImageURISource;
  }
> = (props) => {
  const { cacheConfig, source } = props;
  const cachedSource = useCachedAttachment({ cacheConfig, source });

  return cachedSource.uri ? (
    <Image {...props} source={cachedSource} />
  ) : (
    <View style={props.style}>
      <View style={styles.placeholderWrapper}>
        <Placeholder />
      </View>
    </View>
  );
};
