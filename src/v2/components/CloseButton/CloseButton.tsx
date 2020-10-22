import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#0000001A', // 1A = 10% opacity
    borderRadius: 3,
    borderStyle: 'solid',
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
});

export const CloseButton: React.FC = () => {
  const {
    theme: {
      closeButton: { container },
    },
  } = useTheme();

  return (
    <View style={[styles.container, container]}>
      <Image
        source={require('../../../images/icons/close-round.png')}
        testID='close-button'
      />
    </View>
  );
};

CloseButton.displayName = 'CloseButton{closeButton}';
