import React, { PropsWithChildren } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

import { useShimmerContext } from './ShimmerContext';

import { useMessageContext } from '../../../contexts/messageContext/MessageContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';

type Props = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export const ShimmerView = ({ children, style }: Props) => {
  const { progress, visibleMessages } = useShimmerContext();
  const { message } = useMessageContext();

  const messageId = message?.id;

  const {
    theme: {
      shimmer: { width, height },
    },
  } = useTheme();
  const styles = useStyles();

  const animatedStyle = useAnimatedStyle(() => {
    return visibleMessages.value.includes(messageId)
      ? {
          transform: [{ translateX: progress?.value ?? 0 }],
        }
      : {};
  }, [messageId]);

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.shimmerContainer, animatedStyle]}>
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Defs>
            <LinearGradient id='shimmerGradient' x1='0' y1='0' x2='1' y2='0'>
              <Stop offset='0' stopColor='white' stopOpacity='0' />
              <Stop offset='0.5' stopColor='white' stopOpacity='0.35' />
              <Stop offset='1' stopColor='white' stopOpacity='0' />
            </LinearGradient>
          </Defs>

          <Rect width={width} height={height} fill='url(#shimmerGradient)' />
        </Svg>
      </Animated.View>

      <View style={styles.content}>{children}</View>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: {
      shimmer: { width, height },
    },
  } = useTheme();
  return StyleSheet.create({
    container: {
      flex: 1,
      overflow: 'hidden',
    },
    shimmerContainer: {
      width,
      height,
    },
    content: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
};
