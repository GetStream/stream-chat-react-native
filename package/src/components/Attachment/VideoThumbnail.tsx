import React from 'react';
import { ImageBackground, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { AttachmentUploadIndicator } from './AttachmentUploadIndicator';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { usePendingAttachmentUpload } from '../../hooks/usePendingAttachmentUpload';
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
  const { imageStyle, localId, style, thumb_url } = props;
  const { isUploading, uploadProgress } = usePendingAttachmentUpload(localId);

  return (
    <ImageBackground
      accessibilityLabel='Video Thumbnail'
      imageStyle={imageStyle}
      source={{ uri: thumb_url }}
      style={[styles.container, container, style]}
    >
      <VideoPlayIndicator size='md' />
      {isUploading ? (
        <View pointerEvents='none' style={styles.uploadProgressContainer}>
          <AttachmentUploadIndicator uploadProgress={uploadProgress} />
        </View>
      ) : null}
    </ImageBackground>
  );
};
