import React from 'react';
import { ImageBackground, StyleSheet, View, ViewProps } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Play } from '../../icons';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'black',
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  roundedView: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 50,
    display: 'flex',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
});

export type VideoThumbnailProps = ViewProps & {
  thumb_url?: string;
};

export const VideoThumbnail: React.FC<VideoThumbnailProps> = (props) => {
  const {
    theme: {
      messageSimple: {
        videoThumbnail: { container, roundedView },
      },
    },
  } = useTheme();
  const { style, thumb_url, ...rest } = props;
  return (
    <ImageBackground
      source={{ uri: thumb_url }}
      {...rest}
      style={[styles.container, container, style]}
      testID='video-thumbnail'
    >
      <View style={[styles.roundedView, roundedView]}>
        <Play height={24} pathFill={'#000'} width={24} />
      </View>
    </ImageBackground>
  );
};
