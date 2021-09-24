import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Placeholder from './Placeholder';

import type { ImageProps, ImageURISource } from 'react-native';

import { useCachedAvatar } from './useCachedAvatar';

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

export const CachedAvatar: React.FC<
  Omit<ImageProps, 'source'> & {
    channelId: string | undefined;
    source: ImageURISource;
  }
> = (props) => {
  const cachedSource = useCachedAvatar(props);

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
