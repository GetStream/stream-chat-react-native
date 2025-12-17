import React, { useMemo } from 'react';
import { View } from 'react-native';
import type { ImageStyle, StyleProp } from 'react-native';
import Animated, { SharedValue } from 'react-native-reanimated';

import { useChatConfigContext } from '../../../contexts/chatConfigContext/ChatConfigContext';
import { useImageGalleryContext } from '../../../contexts/imageGalleryContext/ImageGalleryContext';
import { useStateStore } from '../../../hooks/useStateStore';
import {
  ImageGalleryAsset,
  ImageGalleryState,
} from '../../../state-store/image-gallery-state-store';
import { getResizedImageUrl } from '../../../utils/getResizedImageUrl';
import { useAnimatedGalleryStyle } from '../hooks/useAnimatedGalleryStyle';

const oneEighth = 1 / 8;

type Props = {
  accessibilityLabel: string;
  offsetScale: SharedValue<number>;
  photo: ImageGalleryAsset;
  scale: SharedValue<number>;
  screenHeight: number;
  screenWidth: number;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  style?: StyleProp<ImageStyle>;
};

const imageGallerySelector = (state: ImageGalleryState) => ({
  currentIndex: state.currentIndex,
});

export const AnimatedGalleryImage = React.memo(
  (props: Props) => {
    const {
      accessibilityLabel,
      offsetScale,
      photo,
      scale,
      screenHeight,
      screenWidth,
      style,
      translateX,
      translateY,
    } = props;
    const { resizableCDNHosts } = useChatConfigContext();
    const { imageGalleryStateStore } = useImageGalleryContext();
    const { currentIndex } = useStateStore(imageGalleryStateStore.state, imageGallerySelector);

    const uri = useMemo(() => {
      return getResizedImageUrl({
        height: screenHeight,
        resizableCDNHosts,
        url: photo.uri,
        width: screenWidth,
      });
    }, [photo.uri, resizableCDNHosts, screenHeight, screenWidth]);

    const index = photo.index;

    const animatedStyles = useAnimatedGalleryStyle({
      index,
      offsetScale,
      previous: currentIndex > index,
      scale,
      screenHeight,
      selected: currentIndex === index,
      translateX,
      translateY,
    });

    const shouldRender = Math.abs(currentIndex - index) < 4;

    /**
     * An empty view is rendered for images not close to the currently
     * selected in order to maintain spacing while reducing the image
     * load on memory.
     */
    if (!shouldRender) {
      return <View style={[style, { transform: [{ scale: oneEighth }] }]} />;
    }

    return (
      <Animated.Image
        accessibilityLabel={accessibilityLabel}
        resizeMode={'contain'}
        source={{ uri }}
        style={[...animatedStyles, style]}
      />
    );
  },
  (prevProps, nextProps) => {
    if (
      prevProps.photo.uri === nextProps.photo.uri &&
      prevProps.screenHeight === nextProps.screenHeight &&
      prevProps.screenWidth === nextProps.screenWidth
    ) {
      return true;
    }
    return false;
  },
);

AnimatedGalleryImage.displayName = 'AnimatedGalleryImage';
