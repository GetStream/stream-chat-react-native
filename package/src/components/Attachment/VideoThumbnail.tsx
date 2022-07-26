import React from 'react';
import { ImageBackground, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

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
    borderRadius: 50,
    display: 'flex',
    elevation: 6,
    height: 36,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      height: 3,
      width: 0,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    width: 36,
  },
});

export type VideoThumbnailProps = {
  imageStyle?: StyleProp<ImageStyle>;
  style?: StyleProp<ViewStyle>;
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
  const { imageStyle, style, thumb_url } = props;
  return (
    <ImageBackground
      accessibilityLabel='Video Thumbnail'
      imageStyle={imageStyle}
      source={{ uri: thumb_url }}
      style={[styles.container, container, style]}
    >
      <View style={[styles.roundedView, roundedView]}>
        <Play height={24} pathFill={'#000'} width={24} />
      </View>
    </ImageBackground>
  );
};
