import type { ImageStyle } from 'react-native';
import { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { useViewport } from '../../../hooks/useViewport';

type Props = {
  currentIndexShared: SharedValue<number>;
  index: number;
  offsetScale: SharedValue<number>;
  scale: SharedValue<number>;
  screenHeight: number;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
};

const oneEighth = 1 / 8;

/**
 * Named via `ReturnType` because Reanimated does not export `AnimatedStyleHandle` from its root. An
 * inferred return type would inline React Native's internal style types, which cannot be written
 * into the emitted declarations (TS2883).
 */
type GalleryAnimatedStyle = ReturnType<typeof useAnimatedStyle<ImageStyle>>;

export const useAnimatedGalleryStyle = ({
  currentIndexShared,
  index,
  offsetScale,
  scale,
  screenHeight,
  translateX,
  translateY,
}: Props): [GalleryAnimatedStyle, GalleryAnimatedStyle] => {
  const { vw } = useViewport();

  const screenWidth = vw(100);
  const halfScreenWidth = vw(50);

  // The selected image is scaled and translated by the gestures. Its neighbors shift in X when the
  // scale is above 1 to keep their distance from it, and stay in place below 1 so they do not
  // enter the screen as the image shrinks.
  const animatedGalleryStyle = useAnimatedStyle<ImageStyle>(() => {
    const selected = currentIndexShared.value === index;
    const previous = currentIndexShared.value > index;
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
          scale: selected ? scale.value / 8 : oneEighth,
        },
        { scaleX: 1 },
      ],
    };
  }, []);

  const animatedStyles = useAnimatedStyle<ImageStyle>(() => {
    const xScaleOffset = 7 * screenWidth * (0.5 + index);
    const yScaleOffset = -screenHeight * 3.5;
    return {
      transform: [
        { scaleX: 1 },
        { translateY: yScaleOffset },
        {
          translateX: -xScaleOffset,
        },
        { scale: oneEighth },
      ],
    };
  }, [index]);

  return [animatedGalleryStyle, animatedStyles];
};
