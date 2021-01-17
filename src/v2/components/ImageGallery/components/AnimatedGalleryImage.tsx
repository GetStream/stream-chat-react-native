import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { vh, vw } from '../../../utils/utils';

import type { ImageStyle, StyleProp } from 'react-native';

const screenHeight = vh(100);
const screenWidth = vw(100);
const halfScreenWidth = vw(50);

type Props = {
  index: number;
  offsetScale: Animated.SharedValue<number>;
  photo: { uri: string };
  previous: boolean;
  scale: Animated.SharedValue<number>;
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
    const AnimatedGalleryImageStyle = useAnimatedStyle<ImageStyle>(
      () => ({
        transform: [
          {
            translateX: selected
              ? translateX.value - halfScreenWidth * 7 - index * screenWidth * 7
              : scale.value < 1 || scale.value !== offsetScale.value
              ? -halfScreenWidth * 7 - index * screenWidth * 7
              : previous
              ? translateX.value -
                halfScreenWidth * (scale.value - 1) -
                halfScreenWidth * 7 -
                index * screenWidth * 7
              : translateX.value +
                halfScreenWidth * (scale.value - 1) -
                halfScreenWidth * 7 -
                index * screenWidth * 7,
          },
          {
            translateY: selected
              ? translateY.value - screenHeight * 3.5
              : -screenHeight * 3.5,
          },
          {
            scale: selected ? scale.value / 8 : 1 / 8,
          },
          { scaleX: -1 },
        ],
      }),
      [previous, selected],
    );

    /**
     * An empty view is rendered for images not close to the currently
     * selected in order to maintain spacing while reducing the image
     * load on memory.
     */
    if (!shouldRender) {
      return <View style={style} />;
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
                translateX:
                  -translateX.value +
                  halfScreenWidth * 7 +
                  index * screenWidth * 7,
              },
              { scale: 1 / 8 },
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
      prevProps.index === nextProps.index
    ) {
      return true;
    }
    return false;
  },
);

AnimatedGalleryImage.displayName = 'AnimatedGalleryImage';
