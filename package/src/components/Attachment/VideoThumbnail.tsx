import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

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
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
});

export type VideoThumbnailProps = ViewProps;

export const VideoThumbnail: React.FC<VideoThumbnailProps> = (props) => {
  const {
    theme: {
      colors: { black, white_snow },
      messageSimple: {
        videoThumbnail: { container, roundedView },
      },
    },
  } = useTheme();
  const { style, ...rest } = props;
  return (
    <View {...rest} style={[styles.container, container, style]}>
      <View style={[styles.roundedView, roundedView, { backgroundColor: white_snow }]}>
        <Play height={24} pathFill={black} width={24} />
      </View>
    </View>
  );
};
