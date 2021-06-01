import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    height: 20,
    justifyContent: 'center',
  },
  handle: {
    borderRadius: 2,
    height: 4,
    width: 40,
  },
});

export const AttachmentPickerBottomSheetHandle: React.FC<{
  animatedIndex: Animated.SharedValue<number>;
}> = ({ animatedIndex }) => {
  const {
    theme: {
      colors: { black, white },
    },
  } = useTheme();

  const style = useAnimatedStyle<ViewStyle>(() => ({
    borderTopLeftRadius: animatedIndex.value > 0 ? 16 - animatedIndex.value * 16 : 16,
    borderTopRightRadius: animatedIndex.value > 0 ? 16 - animatedIndex.value * 16 : 16,
  }));

  return (
    <Animated.View style={[styles.container, { backgroundColor: white }, style]}>
      <View style={[styles.handle, { backgroundColor: `${black}1A` }]} />
      {/* ^ 1A = 10% opacity */}
    </Animated.View>
  );
};
