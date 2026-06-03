import React from 'react';
import { StyleSheet, View } from 'react-native';

import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

const CLIPPING_FADE_HEIGHT = 16;
const CLIPPING_FADE_GRADIENT_ID = 'sdk-clipping-fade-bottom';

export type ClippingFadeBottomProps = {
  /**
   * Color the fade ramps toward at the bottom edge. Typically the
   * background color of the surface beneath the fade so the bottom edge of
   * scrolling content visually melts into it.
   */
  backgroundColor: string;
};

/**
 * Bottom edge fade overlay. Draws a 16px tall SVG linear gradient that
 * ramps from the supplied background's transparent variant at the top to
 * fully opaque at the bottom - visually clipping any content that scrolls
 * past the lower edge of its parent. `pointerEvents='none'` so it doesn't
 * intercept taps/scrolls on the rows underneath.
 */
export const ClippingFadeBottom = ({ backgroundColor }: ClippingFadeBottomProps) => (
  <View pointerEvents='none' style={styles.fade}>
    <Svg height='100%' width='100%'>
      <Defs>
        <LinearGradient id={CLIPPING_FADE_GRADIENT_ID} x1='0' x2='0' y1='0' y2='1'>
          <Stop offset='0' stopColor={backgroundColor} stopOpacity='0' />
          <Stop offset='1' stopColor={backgroundColor} stopOpacity='1' />
        </LinearGradient>
      </Defs>
      <Rect fill={`url(#${CLIPPING_FADE_GRADIENT_ID})`} height='100%' width='100%' />
    </Svg>
  </View>
);

const styles = StyleSheet.create({
  fade: {
    bottom: 0,
    height: CLIPPING_FADE_HEIGHT,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});
