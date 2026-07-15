import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

export type SpinnerProps = {
  height?: number;
  style?: StyleProp<ViewStyle>;
  width?: number;
};

export const Spinner = (props: SpinnerProps) => {
  const rotation = useSharedValue(0);
  const { icons } = useComponentsContext();
  const { height, style, width } = props;

  const {
    theme: { spinner, semantics },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[style, styles.spinner, animatedStyle, spinner, { height, width }]}>
      <icons.Loading
        height={height}
        startColor={semantics.accentPrimary}
        stopColor={semantics.accentPrimary}
        width={width}
      />
    </Animated.View>
  );
};

Spinner.displayName = 'Spinner{spinner}';

const styles = StyleSheet.create({
  spinner: {
    height: 16,
    justifyContent: 'center',
    margin: 5,
    width: 16,
  },
});
