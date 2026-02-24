import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Rect, Defs, LinearGradient, Stop, ClipPath, G, Mask } from 'react-native-svg';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

export const Skeleton = () => {
  const width = useWindowDimensions().width;
  const startOffset = useSharedValue(-width);
  const styles = useStyles();

  const {
    theme: {
      channelListSkeleton: { animationTime = 1500, container, height = 80 },
      semantics,
    },
  } = useTheme();

  useEffect(() => {
    startOffset.value = withRepeat(
      withTiming(width, {
        duration: animationTime,
        easing: Easing.linear,
      }),
      -1,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: startOffset.value }],
    }),
    [],
  );

  return (
    <View style={[styles.container, container]} testID='channel-preview-skeleton'>
      <Animated.View style={[animatedStyle]}>
        <Svg width={width} height={height} viewBox='0 0 402 80' fill='none'>
          {/* Mask */}
          <Defs>
            <Mask id='path-1-inside-1_5596_231135'>
              <Path d='M0 0H402V80H0V0Z' fill='white' />
            </Mask>

            {/* Gradients */}
            <LinearGradient
              id='paint0_linear_5596_231135'
              x1='48'
              y1='24'
              x2='0'
              y2='24'
              gradientUnits='userSpaceOnUse'
            >
              <Stop stopColor='white' />
              <Stop offset='1' stopColor='white' stopOpacity='0' />
            </LinearGradient>

            <LinearGradient
              id='paint1_linear_5596_231135'
              x1='242'
              y1='8'
              x2='0'
              y2='8'
              gradientUnits='userSpaceOnUse'
            >
              <Stop stopColor='white' />
              <Stop offset='1' stopColor='white' stopOpacity='0' />
            </LinearGradient>

            <LinearGradient
              id='paint2_linear_5596_231135'
              x1='48'
              y1='8'
              x2='0'
              y2='8'
              gradientUnits='userSpaceOnUse'
            >
              <Stop stopColor='white' />
              <Stop offset='1' stopColor='white' stopOpacity='0' />
            </LinearGradient>

            <LinearGradient
              id='paint3_linear_5596_231135'
              x1='199'
              y1='8'
              x2='0'
              y2='8'
              gradientUnits='userSpaceOnUse'
            >
              <Stop stopColor='white' />
              <Stop offset='1' stopColor='white' stopOpacity='0' />
            </LinearGradient>

            {/* ClipPaths */}
            <ClipPath id='clip0_5596_231135'>
              <Path d='M16 40C16 26.7452 26.7452 16 40 16C53.2548 16 64 26.7452 64 40C64 53.2548 53.2548 64 40 64C26.7452 64 16 53.2548 16 40Z' />
            </ClipPath>

            <ClipPath id='clip1_5596_231135'>
              <Path d='M80 28C80 23.5817 83.5817 20 88 20H314C318.418 20 322 23.5817 322 28C322 32.4183 318.418 36 314 36H88C83.5817 60 80 56.4183 80 52Z' />
            </ClipPath>

            <ClipPath id='clip2_5596_231135'>
              <Path d='M338 28C338 23.5817 341.582 20 346 20H378C382.418 20 386 23.5817 386 28C386 32.4183 382.418 36 378 36H346C341.582 36 338 32.4183 338 28Z' />
            </ClipPath>
          </Defs>

          {/* Avatar */}
          <G clipPath='url(#clip0_5596_231135)'>
            <Path
              d='M16 40C16 26.7452 26.7452 16 40 16C53.2548 16 64 26.7452 64 40C64 53.2548 53.2548 64 40 64C26.7452 64 16 53.2548 16 40Z'
              fill={semantics.backgroundCoreSurface}
            />
            <Rect width='48' height='48' x='16' y='16' fill='url(#paint0_linear_5596_231135)' />
          </G>

          {/* Title */}
          <G clipPath='url(#clip1_5596_231135)'>
            <Path
              d='M80 28C80 23.5817 83.5817 20 88 20H314C318.418 20 322 23.5817 322 28C322 32.4183 318.418 36 314 36H88C83.5817 36 80 32.4183 80 28Z'
              fill={semantics.backgroundCoreSurface}
            />
            <Rect width='242' height='16' x='80' y='20' fill='url(#paint1_linear_5596_231135)' />
          </G>

          {/* Badge */}
          <G clipPath='url(#clip2_5596_231135)'>
            <Path
              d='M338 28C338 23.5817 341.582 20 346 20H378C382.418 20 386 23.5817 386 28C386 32.4183 382.418 36 378 36H346C341.582 36 338 32.4183 338 28Z'
              fill={semantics.backgroundCoreSurface}
            />
            <Rect width='48' height='16' x='338' y='20' fill='url(#paint2_linear_5596_231135)' />
          </G>

          {/* Subtitle */}
          <Path
            d='M80 52C80 47.5817 83.5817 44 88 44H272C276.418 44 280 47.5817 280 52C280 56.4183 276.418 60 272 60H88C83.5817 60 80 56.4183 80 52Z'
            fill={semantics.backgroundCoreSurface}
          />
          <Rect width='199' height='16' x='80' y='44' fill='url(#paint3_linear_5596_231135)' />
        </Svg>
      </Animated.View>
    </View>
  );
};

Skeleton.displayName = 'Skeleton{channelListSkeleton}';

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();

  return useMemo(() => {
    return StyleSheet.create({
      container: {
        borderBottomWidth: 1,
        flexDirection: 'row',
        borderBottomColor: semantics.borderCoreDefault,
      },
    });
  }, [semantics]);
};
