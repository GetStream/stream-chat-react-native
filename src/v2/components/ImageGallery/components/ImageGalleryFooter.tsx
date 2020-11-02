import React from 'react';
import { SafeAreaView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

const ReanimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 56,
  },
  safeArea: {
    backgroundColor: '#FFFFFF',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});

type Props = {
  opacity: Animated.SharedValue<number>;
};

export const ImageGalleryFooter: React.FC<Props> = ({ opacity }) => {
  const opacityStyle = useAnimatedStyle<ViewStyle>(
    () => ({
      opacity: opacity.value,
    }),
    [],
  );

  return (
    <ReanimatedSafeAreaView
      style={[
        styles.safeArea,
        opacityStyle,
        { bottom: 0, position: 'absolute' },
      ]}
    >
      <View style={styles.container}>
        <Text>Footer</Text>
      </View>
    </ReanimatedSafeAreaView>
  );
};
