import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';

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
  visible: Animated.SharedValue<number>;
};
export const ImageGalleryHeader: React.FC<Props> = ({ opacity, visible }) => {
  const [height, setHeight] = useState(200);

  const headerStyle = useAnimatedStyle<ViewStyle>(() => ({
    opacity: opacity.value,
    transform: [
      {
        translateY: interpolate(
          visible.value,
          [0, 1],
          [-height, 0],
          Extrapolate.CLAMP,
        ),
      },
    ],
  }));

  return (
    <View
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      pointerEvents={'box-none'}
    >
      <ReanimatedSafeAreaView style={[styles.safeArea, headerStyle]}>
        <View style={styles.container}>
          <Text>Title</Text>
        </View>
      </ReanimatedSafeAreaView>
    </View>
  );
};
