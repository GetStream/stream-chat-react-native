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

export const LoadingDot = (props: Props) => {
  const { diameter = 5, duration = 1500, offset = 0, style } = props;
  const halfDuration = duration / 2;
  const startingOffset = halfDuration - offset;

  const {
    theme: {
      loadingDots: { loadingDot },
      semantics,
    },
  } = useTheme();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          backgroundColor: semantics.chatTextTypingIndicator,
          borderRadius: diameter / 2,
          height: diameter,
          width: diameter,
        },
        style,
        dotStyle,
        loadingDot,
      ]}
    />
  );
};
