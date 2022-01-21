import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { Check } from '../../../icons';

const styles = StyleSheet.create({
  check: {
    borderRadius: 12,
    height: 24,
    marginRight: 8,
    marginTop: 8,
    width: 24,
  },
});

export const ImageOverlaySelectedComponent: React.FC = () => {
  const {
    theme: {
      attachmentPicker: {
        imageOverlaySelectedComponent: { check },
      },
      colors: { white },
    },
  } = useTheme('ImageOverlaySelectedComponent');
  return (
    <View style={[styles.check, { backgroundColor: white }, check]}>
      <Check />
    </View>
  );
};

ImageOverlaySelectedComponent.displayName =
  'ImageOverlaySelectedComponent{attachmentPicker{imageOverlaySelectedComponent}}';
