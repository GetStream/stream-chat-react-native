import React from 'react';
import { ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { VideoPlayIndicator } from '../ui/VideoPlayIndicator';

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
  const { AttachmentUploadIndicator, ImageComponent } = useComponentsContext();
  const { imageStyle, localId, style, thumb_url } = props;

  return (
    <View style={[styles.container, container, style]}>
      <ImageComponent
        accessibilityLabel='Video Thumbnail'
        source={{ uri: thumb_url }}
        style={[StyleSheet.absoluteFill, imageStyle]}
      />
      <VideoPlayIndicator size='md' />
      <AttachmentUploadIndicator localId={localId} sourceUrl={thumb_url} variant='overlay' />
    </View>
  );
};
