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
  },
});

type Props = {
  opacity: Animated.SharedValue<number>;
};
export const ImageGalleryHeader: React.FC<Props> = ({ opacity }) => {
  const opacityStyle = useAnimatedStyle<ViewStyle>(
    () => ({
      opacity: opacity.value,
    }),
    [],
  );

  return (
    <ReanimatedSafeAreaView style={[styles.safeArea, opacityStyle]}>
      <View style={styles.container}>
        <Text>Title</Text>
      </View>
    </ReanimatedSafeAreaView>
  );
};
