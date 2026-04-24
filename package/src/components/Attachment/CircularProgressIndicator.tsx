import React, { useEffect, useMemo, useRef } from 'react';
import type { ColorValue } from 'react-native';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export type CircularProgressIndicatorProps = {
  /** Upload percent **0–100**. */
  progress: number;
  color: ColorValue;
  size?: number;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Circular upload progress ring (determinate) or rotating arc (indeterminate).
 */
export const CircularProgressIndicator = ({
  color,
  progress,
  size = 16,
  strokeWidth = 2,
  style,
  testID,
}: CircularProgressIndicatorProps) => {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => {
      loop.stop();
      spin.setValue(0);
    };
  }, [progress, spin]);

  const rotate = useMemo(
    () =>
      spin.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      }),
    [spin],
  );

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

  if (fraction !== undefined) {
    const offset = circumference * (1 - fraction);
    return (
      <Svg height={size} style={style} testID={testID} viewBox={`0 0 ${size} ${size}`} width={size}>
        <Circle
          cx={cx}
          cy={cy}
          fill='none'
          r={r}
          stroke={color as string}
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
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
      style={[{ height: size, width: size }, style, { transform: [{ rotate }] }]}
      testID={testID}
    >
      <Svg height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
        <Circle
          cx={cx}
          cy={cy}
          fill='none'
          r={r}
          stroke={color as string}
          strokeDasharray={`${arc} ${gap}`}
          strokeLinecap='round'
          strokeWidth={strokeWidth}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>
    </Animated.View>
  );
};
