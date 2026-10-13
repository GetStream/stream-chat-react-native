import { type PropsWithChildren, useEffect, useMemo, useState } from 'react';
import {
  type LayoutChangeEvent,
  processColor,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';

export type ShimmeringViewProps = PropsWithChildren<{ shimmerColor: string }>;

/**
 * Converts any React Native color value into a normalized hex color string in
 * the `#RRGGBB` format.
 *
 * This function accepts any color supported by React Native, including:
 * - Hex strings (`#RGB`, `#RRGGBB`, `#RRGGBBAA`)
 * - `rgb(...)` / `rgba(...)`
 * - Named colors (`red`, `blue`, `transparent`, etc.)
 *
 * Internally, React Native’s `processColor()` is used to resolve the input into
 * a 32-bit color integer, from which the RGB channels are extracted and returned
 * as a consistent uppercase hex string.
 *
 * Notes:
 * - Alpha values are **discarded** - this always returns a fully opaque `#RRGGBB`
 * - If the input cannot be processed as a color, the function returns `#FFFFFF`
 *
 * @example
 * toHexFromRNColor('#6C6C70');        // → "#6c6c70"
 * toHexFromRNColor('rgb(108,108,112)'); // → "#6c6c70"
 * toHexFromRNColor('red');            // → "#ff0000"
 * toHexFromRNColor('rgba(0,0,0,0.5)'); // → "#000000"  (alpha removed)
 *
 * @param color - Any valid React Native color string
 * @returns A normalized hex color (`#RRGGBB`) or `#FFFFFF` for invalid input
 */
export const toHexFromRNColor = (color: string): string => {
  const v = processColor(color);
  if (v == null || typeof v !== 'number') return '#FFFFFF';

  const r = (v >> 16) & 255;
  const g = (v >> 8) & 255;
  const b = v & 255;

  const toHex = (n: number) => n.toString(16).padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const ShimmeringView = ({
  children,
  shimmerColor,
}: ShimmeringViewProps) => {
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const progress = useSharedValue(0);
  const hexColor = useMemo(
    () => toHexFromRNColor(shimmerColor),
    [shimmerColor],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setLayout({ width, height });
  };

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 1200 }), -1, false);
  }, [progress]);

  const shimmerStyle = useAnimatedStyle(() => {
    const { width } = layout;
    if (!width) return { opacity: 0 };

    const barWidth = width * 0.4;
    const travel = width + barWidth;

    const translateX = interpolate(progress.value, [0, 1], [-barWidth, travel]);

    return {
      width: barWidth,
      transform: [{ translateX }],
      opacity: 1,
    };
  }, [layout]);

  return (
    <View style={styles.wrapper} onLayout={onLayout}>
      {children}
      {layout.width > 0 && layout.height > 0 && (
        <View pointerEvents="none" style={styles.shimmerOverlay}>
          <Animated.View style={[styles.shimmerBar, shimmerStyle]}>
            <Canvas style={StyleSheet.absoluteFill}>
              <Rect
                x={0}
                y={0}
                width={layout.width * 0.4}
                height={layout.height}
              >
                <LinearGradient
                  // horizontal gradient
                  start={vec(0, layout.height / 2)}
                  end={vec(layout.width * 0.4, layout.height / 2)}
                  colors={[
                    `${hexColor}00`,
                    `${hexColor}80`, // 50% alpha
                    `${hexColor}00`,
                  ]}
                />
              </Rect>
            </Canvas>
          </Animated.View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  shimmerBar: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
});
