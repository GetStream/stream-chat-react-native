import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Loading } from '../../icons/Loading';

const styles = StyleSheet.create({
  spinner: {
    height: 16,
    justifyContent: 'center',
    margin: 5,
    width: 16,
  },
});

export const Spinner: React.FC = () => {
  const rotation = useSharedValue(0);

  const {
    theme: {
      colors: { accent_blue },
      spinner,
    },
  } = useTheme();

  const animatedStyle = useAnimatedStyle<ViewStyle>(() => ({
    transform: [
      {
        rotate: `${rotation.value}deg`,
      },
    ],
  }));

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 800,
        easing: Easing.linear,
      }),
      -1,
    );
  }, []);

  return (
    <Animated.View style={[styles.spinner, animatedStyle, spinner]}>
      <Loading stopColor={accent_blue} />
    </Animated.View>
  );
};

Spinner.displayName = 'Spinner{spinner}';
