import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 20,
    justifyContent: 'center',
  },
  handle: {
    backgroundColor: '#0000001A',
    borderRadius: 2,
    height: 4,
    width: 40,
  },
});

export const AttachmentPickerBottomSheetHandle: React.FC<{
  animatedPositionIndex: Animated.SharedValue<number>;
}> = ({ animatedPositionIndex }) => {
  const style = useAnimatedStyle<ViewStyle>(() => ({
    borderTopLeftRadius:
      animatedPositionIndex.value > 0
        ? 16 - animatedPositionIndex.value * 16
        : 16,
    borderTopRightRadius:
      animatedPositionIndex.value > 0
        ? 16 - animatedPositionIndex.value * 16
        : 16,
  }));

  return (
    <Animated.View style={[styles.container, style]}>
      <View style={styles.handle} />
    </Animated.View>
  );
};
