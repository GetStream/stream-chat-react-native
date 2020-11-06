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
  wrapper: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});

type Props = {
  opacity: Animated.SharedValue<number>;
  visible: Animated.SharedValue<number>;
};

export const ImageGalleryFooter: React.FC<Props> = ({ opacity, visible }) => {
  const [height, setHeight] = useState(200);

  const footerStyle = useAnimatedStyle<ViewStyle>(
    () => ({
      opacity: opacity.value,
      transform: [
        {
          translateY: interpolate(
            visible.value,
            [0, 1],
            [height, 0],
            Extrapolate.CLAMP,
          ),
        },
      ],
    }),
    [],
  );

  return (
    <Animated.View
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      pointerEvents={'box-none'}
      style={styles.wrapper}
    >
      <ReanimatedSafeAreaView style={[styles.safeArea, footerStyle]}>
        <View style={styles.container}>
          <Text>Footer</Text>
        </View>
      </ReanimatedSafeAreaView>
    </Animated.View>
  );
};
