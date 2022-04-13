import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import type { ImageStyle, StyleProp } from 'react-native';

import { Video } from '../../../native';

const oneEight = 1 / 8;

const styles = StyleSheet.create({
  videoPlayer: {
    backgroundColor: '#000',
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
  },
});

type Props = {
  index: number;
  shouldRender: boolean;
  source: { uri: string };
  style?: StyleProp<ImageStyle>;
};

export const GalleryVideo: React.FC<Props> = React.memo(
  (props) => {
    const { shouldRender, source, style } = props;

    /**
     * An empty view is rendered for images not close to the currently
     * selected in order to maintain spacing while reducing the image
     * load on memory.
     */
    if (!shouldRender) {
      return <View style={[style, { transform: [{ scale: oneEight }] }]} />;
    }

    return <Video style={styles.videoPlayer} uri={source.uri} />;
  },
  (prevProps, nextProps) => {
    if (
      prevProps.shouldRender === nextProps.shouldRender &&
      prevProps.source.uri === nextProps.source.uri
    ) {
      return true;
    }
    return false;
  },
);

GalleryVideo.displayName = 'GalleryVideo';
