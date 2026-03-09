import React from 'react';
import { ActivityIndicator, StyleSheet, View, ViewProps } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

export type ImageUploadingIndicatorProps = ViewProps;

export const ImageUploadingIndicator = (props: ImageUploadingIndicatorProps) => {
  const {
    theme: {
      messageSimple: {
        loadingIndicator: { container },
      },
      semantics,
    },
  } = useTheme();
  const { style, ...rest } = props;
  return (
    <View
      {...rest}
      accessibilityHint='image-uploading'
      style={[StyleSheet.absoluteFillObject, container, style]}
    >
      <ActivityIndicator color={semantics.accentPrimary} />
    </View>
  );
};
