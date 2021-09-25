import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import Placeholder from './Placeholder';

import type { ImageBackgroundProps, ImageURISource } from 'react-native';

import { useCachedAttachment } from './useCachedAttachment';

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

export const CachedImageBackground: React.FC<
  Omit<ImageBackgroundProps, 'source'> & {
    cacheConfig: GalleryImageCacheConfig;
    source: ImageURISource;
  }
> = (props) => {
  const { cacheConfig, source } = props;
  const cachedSource = useCachedAttachment({ cacheConfig, source });

  return cachedSource.uri ? (
    <ImageBackground {...props} source={cachedSource} />
  ) : (
    <View style={props.style}>
      <View style={styles.placeholderWrapper}>
        <Placeholder />
      </View>
    </View>
  );
};
