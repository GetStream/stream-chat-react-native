import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

const AnimatedView = Animated.createAnimatedComponent(Animated.View);

const styles = StyleSheet.create({
  spinner: {
    borderRadius: 30,
    borderRightColor: 'transparent',
    borderWidth: 2,
    height: 30,
    justifyContent: 'center',
    margin: 5,
    width: 30,
  },
});

/**
 * @example ./Spinner.md
 */
export const Spinner: React.FC = () => {
  const rotateValue = useRef(new Animated.Value(0));

  const {
    theme: {
      colors: { primary },
      spinner,
    },
  } = useTheme();

  const loop = Animated.loop(
    Animated.timing(rotateValue.current, {
      duration: 800,
      easing: Easing.linear,
      toValue: 1,
      useNativeDriver: true,
    }),
  );

  useEffect(() => {
    loop.start();
    return loop.stop;
  });

  return (
    <AnimatedView
      style={[
        styles.spinner,
        {
          borderColor: primary,
          transform: [
            {
              rotate: rotateValue.current.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        },
        spinner,
      ]}
    />
  );
};

Spinner.displayName = 'Spinner{spinner}';
