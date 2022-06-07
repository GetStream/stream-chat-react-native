import React from 'react';
import { ActivityIndicator, StyleSheet, View, ViewProps } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

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

export type ImageLoadingIndicatorProps = ViewProps;

export const ImageLoadingIndicator: React.FC<ImageLoadingIndicatorProps> = (props) => {
  const {
    theme: {
      messageSimple: {
        videoThumbnail: { container },
      },
    },
  } = useTheme();
  const { style, ...rest } = props;
  return (
    <View {...rest} style={[styles.container, container, style]}>
      <ActivityIndicator />
    </View>
  );
};
