import React from 'react';
import { ActivityIndicator, StyleSheet, View, ViewProps } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
});

export type ImageLoadingIndicatorProps = ViewProps;

export const ImageLoadingIndicator = (props: ImageLoadingIndicatorProps) => {
  const {
    theme: {
      messageSimple: {
        videoThumbnail: { container },
      },
    },
  } = useTheme();
  const { style, ...rest } = props;
  return (
    <View {...rest} accessibilityHint='loading' style={[styles.container, container, style]}>
      <ActivityIndicator />
    </View>
  );
};
