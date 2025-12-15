import React, { useMemo } from 'react';
import { View } from 'react-native';
import type { ImageStyle, StyleProp } from 'react-native';
import Animated, { SharedValue } from 'react-native-reanimated';

import { useChatConfigContext } from '../../../contexts/chatConfigContext/ChatConfigContext';
import { getResizedImageUrl } from '../../../utils/getResizedImageUrl';
import { useAnimatedGalleryStyle } from '../hooks/useAnimatedGalleryStyle';

const oneEighth = 1 / 8;

type Props = {
  accessibilityLabel: string;
  index: number;
  offsetScale: SharedValue<number>;
  photo: { uri: string };
  previous: boolean;
  scale: SharedValue<number>;
  screenHeight: number;
  screenWidth: number;
  selected: boolean;
  shouldRender: boolean;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  style?: StyleProp<ImageStyle>;
};

export const AnimatedGalleryImage = React.memo(
  (props: Props) => {
    const {
      accessibilityLabel,
      index,
      offsetScale,
      photo,
      previous,
      scale,
      screenHeight,
      screenWidth,
      selected,
      shouldRender,
      style,
      translateX,
      translateY,
    } = props;
    const { resizableCDNHosts } = useChatConfigContext();

    const uri = useMemo(() => {
      return getResizedImageUrl({
        height: screenHeight,
        resizableCDNHosts,
        url: photo.uri,
        width: screenWidth,
      });
    }, [photo.uri, resizableCDNHosts, screenHeight, screenWidth]);

    const animatedStyles = useAnimatedGalleryStyle({
      index,
      offsetScale,
      previous,
      scale,
      screenHeight,
      selected,
      translateX,
      translateY,
    });

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
      prevProps.selected === nextProps.selected &&
      prevProps.shouldRender === nextProps.shouldRender &&
      prevProps.photo.uri === nextProps.photo.uri &&
      prevProps.previous === nextProps.previous &&
      prevProps.index === nextProps.index &&
      prevProps.screenHeight === nextProps.screenHeight &&
      prevProps.screenWidth === nextProps.screenWidth
    ) {
      return true;
    }
    return false;
  },
);

AnimatedGalleryImage.displayName = 'AnimatedGalleryImage';
