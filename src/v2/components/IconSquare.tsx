import React from 'react';
import {
  GestureResponderEvent,
  Image,
  ImageRequireSource,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { useTheme } from '../contexts/themeContext/hooks/useTheme';

const styles = StyleSheet.create({
  container: {
    /**
     * 0D is 5% opacity in 8-digit hex
     */
    backgroundColor: '#0000000D',
    borderRadius: 5,
    padding: 5,
  },
});

export type IconSquareProps = {
  icon: ImageRequireSource;
  onPress?: (event: GestureResponderEvent) => void;
};

export const IconSquare: React.FC<IconSquareProps> = (props) => {
  const { icon, onPress } = props;
  const { theme } = useTheme();

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.container, theme.iconSquare.container]}
        testID='icon-square'
      >
        <Image source={icon} style={{ height: 15, width: 15 }} />
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[styles.container, theme.iconSquare.container]}
      testID='icon-square'
    >
      <Image source={icon} style={{ height: 15, width: 15 }} />
    </View>
  );
};
