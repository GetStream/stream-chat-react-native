import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
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

export type SpinnerProps = {
  height?: number;
  style?: StyleProp<ViewStyle>;
  width?: number;
};

export const Spinner: React.FC<SpinnerProps> = (props) => {
  const rotation = useSharedValue(0);
  const { height, style, width } = props;

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
    <Animated.View style={[style, styles.spinner, animatedStyle, spinner, { height, width }]}>
      <Loading height={height} stopColor={accent_blue} width={width} />
    </Animated.View>
  );
};

Spinner.displayName = 'Spinner{spinner}';
