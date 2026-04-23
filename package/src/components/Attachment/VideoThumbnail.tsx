import React from 'react';
import { ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { AttachmentUploadIndicator } from './AttachmentUploadIndicator';

import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { primitives } from '../../theme';
import { VideoPlayIndicator } from '../ui/VideoPlayIndicator';

const styles = StyleSheet.create({
  uploadProgressContainer: {
    alignItems: 'flex-start',
    bottom: primitives.spacingXxs,
    justifyContent: 'flex-start',
    left: primitives.spacingXxs,
    position: 'absolute',
  },
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
  const { ImageComponent } = useComponentsContext();
  const { imageStyle, localId, style, thumb_url } = props;

  return (
    <View style={[styles.container, container, style]}>
      <ImageComponent
        accessibilityLabel='Video Thumbnail'
        source={{ uri: thumb_url }}
        style={[StyleSheet.absoluteFill, imageStyle]}
      />
      <VideoPlayIndicator size='md' />
      <AttachmentUploadIndicator
        containerStyle={styles.uploadProgressContainer}
        localId={localId}
        sourceUrl={thumb_url}
      />
    </View>
  );
};
