import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { vw } from '../../../utils/utils';

import type { ImageStyle, StyleProp } from 'react-native';

const screenWidth = vw(100);
const halfScreenWidth = vw(50);
const oneEight = 1 / 8;

type Props = {
  index: number;
  offsetScale: Animated.SharedValue<number>;
  photo: { uri: string };
  previous: boolean;
  scale: Animated.SharedValue<number>;
  screenHeight: number;
  selected: boolean;
  shouldRender: boolean;
  translateX: Animated.SharedValue<number>;
  translateY: Animated.SharedValue<number>;
  style?: StyleProp<ImageStyle>;
};

export const AnimatedGalleryImage: React.FC<Props> = React.memo(
  (props) => {
    const {
      index,
      offsetScale,
      photo,
      previous,
      scale,
      screenHeight,
      selected,
      shouldRender,
      style,
      translateX,
      translateY,
    } = props;

    /**
     * The current image, designated by selected is scaled and translated
     * based on the gestures. The rendered images before and after the
     * currently selected image also translated in X if the scale is
     * greater than one so they keep the same distance from the selected
     * image as it is scaled. If the scale is less than one they stay in
     * place as to not come into the screen when the image shrinks.
     */
    const AnimatedGalleryImageStyle = useAnimatedStyle<ImageStyle>(() => {
      const xScaleOffset = -7 * screenWidth * (0.5 + index);
      const yScaleOffset = -screenHeight * 3.5;
      return {
        transform: [
          {
            translateX: selected
              ? translateX.value + xScaleOffset
              : scale.value < 1 || scale.value !== offsetScale.value
              ? xScaleOffset
              : previous
              ? translateX.value - halfScreenWidth * (scale.value - 1) + xScaleOffset
              : translateX.value + halfScreenWidth * (scale.value - 1) + xScaleOffset,
          },
          {
            translateY: selected ? translateY.value + yScaleOffset : yScaleOffset,
          },
          {
            scale: selected ? scale.value / 8 : oneEight,
          },
          { scaleX: -1 },
        ],
      };
    }, [previous, selected]);

    /**
     * An empty view is rendered for images not close to the currently
     * selected in order to maintain spacing while reducing the image
     * load on memory.
     */
    if (!shouldRender) {
      return <View style={[style, { transform: [{ scale: oneEight }] }]} />;
    }

    return (
      <Animated.Image
        resizeMode={'contain'}
        source={{ uri: photo.uri }}
        style={[
          style,
          AnimatedGalleryImageStyle,
          {
            transform: [
              { scaleX: -1 },
              { translateY: -screenHeight * 3.5 },
              {
                translateX: -translateX.value + 7 * screenWidth * (0.5 + index),
              },
              { scale: oneEight },
            ],
          },
        ]}
      />
    );
  },
  (prevProps, nextProps) => {
    if (
      prevProps.selected === nextProps.selected &&
      prevProps.shouldRender === nextProps.shouldRender &&
      prevProps.photo.uri === nextProps.photo.uri &&
      prevProps.previous === nextProps.previous &&
      prevProps.index === nextProps.index &&
      prevProps.screenHeight === nextProps.screenHeight
    ) {
      return true;
    }
    return false;
  },
);

AnimatedGalleryImage.displayName = 'AnimatedGalleryImage';
