import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../theme';
import { BadgeNotification } from '../../ui';

const styles = StyleSheet.create({
  check: {
    borderRadius: primitives.radiusMax,
    height: 24,
    marginRight: 8,
    marginTop: 8,
    width: 24,
  },
});

export const ImageOverlaySelectedComponent = ({ index }: { index: number }) => {
  const {
    theme: {
      semantics,
      attachmentPicker: {
        imageOverlaySelectedComponent: { check },
      },
    },
  } = useTheme();
  return (
    <View
      style={[
        styles.check,
        index === -1
          ? { borderWidth: 2, borderColor: semantics.borderCoreOnAccent }
          : { backgroundColor: semantics.badgeBgPrimary },
        check,
      ]}
    >
      {index !== -1 ? <BadgeNotification count={index + 1} size='sm' type='primary' /> : null}
    </View>
  );
};

ImageOverlaySelectedComponent.displayName =
  'ImageOverlaySelectedComponent{attachmentPicker{imageOverlaySelectedComponent}}';
