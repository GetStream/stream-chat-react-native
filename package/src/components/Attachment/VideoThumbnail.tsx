import React from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { primitives } from '../../theme';
import { VideoPlayIndicator } from '../ui';

export type VideoThumbnailProps = {
  imageStyle?: StyleProp<ImageStyle>;
  style?: StyleProp<ViewStyle>;
  thumb_url?: string;
  /**
   * Whether the attachment is currently being uploaded.
   * This is used to show a loading indicator in the thumbnail.
   */
  isPendingAttachmentUploading?: boolean;
};

export const VideoThumbnail = (props: VideoThumbnailProps) => {
  const {
    theme: {
      messageSimple: {
        videoThumbnail: { container },
      },
      semantics,
    },
  } = useTheme();
  const { imageStyle, style, thumb_url, isPendingAttachmentUploading } = props;
  return (
    <ImageBackground
      accessibilityLabel='Video Thumbnail'
      imageStyle={imageStyle}
      source={{ uri: thumb_url }}
      style={[styles.container, container, style]}
    >
      <VideoPlayIndicator size='md' />
      {isPendingAttachmentUploading && (
        <View style={styles.activityIndicatorContainer}>
          <ActivityIndicator style={styles.activityIndicator} color={semantics.accentPrimary} />
        </View>
      )}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    overflow: 'hidden',
  },
  activityIndicatorContainer: {
    position: 'absolute',
    left: primitives.spacingXs,
    bottom: primitives.spacingXs,
  },
  activityIndicator: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
});
