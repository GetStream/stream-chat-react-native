import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import base64Placeholder from './base64Placeholder';
import { useCachedAttachment } from './useCachedAttachment';

import type { ImageProps, ImageURISource } from 'react-native';

type GalleryImageCacheConfig = {
  channelId: string | undefined;
  messageId: string | undefined;
};

const styles = StyleSheet.create({
  placeholder: {
    height: '50%',
    width: '50%',
  },
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
        <Image resizeMode='contain' source={base64Placeholder} style={styles.placeholder} />
      </View>
    </View>
  );
};
