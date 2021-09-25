import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Placeholder from './Placeholder';

import type { ImageProps, ImageURISource } from 'react-native';

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

export const CachedAnimatedGalleryImage: React.FC<
  Omit<ImageProps, 'source'> & {
    cacheConfig: GalleryImageCacheConfig;
    source: ImageURISource;
  }
> = (props) => {
  const { cacheConfig, source } = props;
  const cachedSource = useCachedAttachment({ cacheConfig, source });

  return cachedSource.uri ? (
    <Animated.Image {...props} source={cachedSource} />
  ) : (
    <Animated.View style={props.style}>
      <View style={styles.placeholderWrapper}>
        <Placeholder />
      </View>
    </Animated.View>
  );
};
