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

export const useAnimatedGalleryStyle = ({
  currentIndexShared,
  index,
  offsetScale,
  scale,
  screenHeight,
  translateX,
  translateY,
}: Props) => {
  const { vw } = useViewport();

  const screenWidth = vw(100);
  const halfScreenWidth = vw(50);

  /**
   * The current image, designated by selected is scaled and translated
   * based on the gestures. The rendered images before and after the
   * currently selected image also translated in X if the scale is
   * greater than one so they keep the same distance from the selected
   * image as it is scaled. If the scale is less than one they stay in
   * place as to not come into the screen when the image shrinks.
   */
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

  const animatedStyles = useAnimatedStyle(() => {
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
