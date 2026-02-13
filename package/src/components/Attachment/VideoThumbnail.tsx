import React from 'react';
import { ImageBackground, ImageStyle, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { VideoPlayIndicator } from '../ui';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    overflow: 'hidden',
  },
});

export type VideoThumbnailProps = {
  imageStyle?: StyleProp<ImageStyle>;
  style?: StyleProp<ViewStyle>;
  thumb_url?: string;
};

export const VideoThumbnail = (props: VideoThumbnailProps) => {
  const {
    theme: {
      messageSimple: {
        videoThumbnail: { container },
      },
    },
  } = useTheme();
  const { imageStyle, style, thumb_url } = props;
  return (
    <ImageBackground
      accessibilityLabel='Video Thumbnail'
      imageStyle={imageStyle}
      source={{ uri: thumb_url }}
      style={[styles.container, container, style]}
    >
      <VideoPlayIndicator size='md' />
    </ImageBackground>
  );
};
