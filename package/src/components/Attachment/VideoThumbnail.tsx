import React from 'react';
import { ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { LoadableGalleryImage } from './GalleryImage';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { VideoPlayIndicator } from '../ui/VideoPlayIndicator';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    overflow: 'hidden',
  },
  playIndicatorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export type VideoThumbnailProps = {
  imageStyle?: StyleProp<ImageStyle>;
  /**
   * When set, upload state is read from `client.uploadManager` for this pending attachment id.
   */
  localId?: string;
  style?: StyleProp<ViewStyle>;
  thumb_url?: string;
};

export const VideoThumbnail = (props: VideoThumbnailProps) => {
  const {
    theme: {
      messageItemView: {
        videoThumbnail: { container },
      },
    },
  } = useTheme();
  const { imageStyle, localId, style, thumb_url } = props;

  return (
    <View style={[styles.container, container, style]}>
      {thumb_url ? (
        <LoadableGalleryImage
          accessibilityLabel='Video Thumbnail'
          containerStyle={StyleSheet.absoluteFill}
          imageStyle={imageStyle}
          localId={localId}
          uri={thumb_url}
        >
          <View
            pointerEvents='none'
            style={[StyleSheet.absoluteFill, styles.playIndicatorContainer]}
          >
            <VideoPlayIndicator size='md' />
          </View>
        </LoadableGalleryImage>
      ) : null}
    </View>
  );
};
