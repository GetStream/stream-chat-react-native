import React from 'react';
import { StyleSheet, View } from 'react-native';

import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

const CLIPPING_FADE_HEIGHT = 16;
const CLIPPING_FADE_GRADIENT_ID = 'sdk-clipping-fade-bottom';

export type ClippingFadeBottomProps = {
  /** Color the fade ramps toward at the bottom edge, usually the background beneath it. */
  backgroundColor: string;
};

/**
 * Bottom edge fade overlay: a 16px tall gradient from transparent to `backgroundColor` that hides
 * content scrolling past the parent's lower edge. It ignores touches (`pointerEvents='none'`).
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
