import React, { useEffect, useMemo } from 'react';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const SPIN_DURATION_MS = 900;
const PROGRESS_ANIMATION_DURATION_MS = 1200;

export type CircularProgressIndicatorProps = {
  /** Upload percent **0–100**. */
  backgroundColor: ColorValue;
  filledColor: ColorValue;
  progress: number;
  unfilledColor: ColorValue;
  size?: number;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Circular upload progress ring (determinate) or rotating arc (indeterminate).
 */
export const CircularProgressIndicator = ({
  backgroundColor,
  filledColor,
  progress,
  size = 16,
  strokeWidth = 2,
  style,
  testID,
  unfilledColor,
}: CircularProgressIndicatorProps) => {
  const animatedProgress = useSharedValue(0);
  const rotation = useSharedValue(0);

  const { cx, cy, r, circumference } = useMemo(() => {
    const pad = strokeWidth / 2;
    const rInner = size / 2 - pad;
    return {
      cx: size / 2,
      cy: size / 2,
      r: rInner,
      circumference: 2 * Math.PI * rInner,
    };
  }, [size, strokeWidth]);

  const fraction =
    progress === undefined || Number.isNaN(progress)
      ? undefined
      : Math.min(100, Math.max(0, progress)) / 100;

  useEffect(() => {
    if (fraction === undefined) {
      animatedProgress.value = 0;
      return;
    }

    animatedProgress.value = withTiming(fraction, {
      duration: PROGRESS_ANIMATION_DURATION_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [animatedProgress, fraction]);

  useEffect(() => {
    if (fraction !== undefined) {
      cancelAnimation(rotation);
      rotation.value = 0;
      return;
    }

    rotation.value = withRepeat(
      withTiming(360, {
        duration: SPIN_DURATION_MS,
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    return () => {
      cancelAnimation(rotation);
    };
  }, [fraction, rotation]);

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  const animatedSpinStyle = useAnimatedStyle<ViewStyle>(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  if (fraction !== undefined) {
    return (
      <Svg height={size} style={style} testID={testID} viewBox={`0 0 ${size} ${size}`} width={size}>
        <Circle
          cx={cx}
          cy={cy}
          fill={backgroundColor}
          r={r}
          stroke={unfilledColor}
          strokeWidth={strokeWidth}
        />
        <AnimatedCircle
          animatedProps={animatedCircleProps}
          cx={cx}
          cy={cy}
          fill='none'
          r={r}
          stroke={filledColor}
          strokeDasharray={`${circumference}`}
          strokeLinecap='round'
          strokeWidth={strokeWidth}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>
    );
  }

  const arc = circumference * 0.22;
  const gap = circumference - arc;

  return (
    <Animated.View
      style={[{ height: size, width: size }, style, animatedSpinStyle]}
      testID={testID}
    >
      <Svg height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
        <Circle
          cx={cx}
          cy={cy}
          fill={backgroundColor}
          r={r}
          stroke={unfilledColor}
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={cx}
          cy={cy}
          fill='none'
          r={r}
          stroke={filledColor}
          strokeDasharray={`${arc} ${gap}`}
          strokeLinecap='round'
          strokeWidth={strokeWidth}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>
    </Animated.View>
  );
};
