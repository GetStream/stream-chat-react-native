import React, { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

type Props = {
  diameter?: number;
  duration?: number;
  offset?: number;
  style?: StyleProp<ViewStyle>;
};

export const LoadingDot: React.FC<Props> = (props) => {
  const { diameter = 4, duration = 1500, offset = 0, style } = props;
  const halfDuration = duration / 2;
  const startingOffset = halfDuration - offset;

  const {
    theme: {
      colors: { black },
      loadingDots: { loadingDot },
    },
  } = useTheme('LoadingDot');
  const opacity = useSharedValue(startingOffset / halfDuration);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(0, { duration: startingOffset, easing: Easing.linear }),
      withRepeat(
        withSequence(
          withTiming(1, { duration: halfDuration, easing: Easing.linear }),
          withTiming(0, { duration: halfDuration, easing: Easing.linear }),
        ),
        -1,
      ),
    );
  }, []);

  const dotStyle = useAnimatedStyle<ViewStyle>(
    () => ({
      opacity: opacity.value,
    }),
    [],
  );

  return (
    <Animated.View
      style={[
        {
          backgroundColor: black,
          borderRadius: diameter / 2,
          height: diameter,
          width: diameter,
        },
        style,
        loadingDot,
        dotStyle,
      ]}
    />
  );
};
