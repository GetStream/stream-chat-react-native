import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ImageStyle, StyleProp } from 'react-native';
import Animated, { SharedValue } from 'react-native-reanimated';
import { SvgUri } from 'react-native-svg';

import { useChatConfigContext } from '../../../contexts/chatConfigContext/ChatConfigContext';
import { useImageGalleryContext } from '../../../contexts/imageGalleryContext/ImageGalleryContext';
import { useStateStore } from '../../../hooks';
import { useIsSvg } from '../../../hooks/useIsSvg';
import {
  ImageGalleryAsset,
  ImageGalleryState,
} from '../../../state-store/image-gallery-state-store';
import { getResizedImageUrl } from '../../../utils/getResizedImageUrl';
import { useAnimatedGalleryStyle } from '../hooks/useAnimatedGalleryStyle';

const oneEighth = 1 / 8;

type Props = {
  accessibilityLabel: string;
  index: number;
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
      index,
      offsetScale,
      photo,
      scale,
      screenHeight,
      screenWidth,
      style,
      translateX,
      translateY,
    } = props;
    const { imageGalleryStateStore } = useImageGalleryContext();
    const { resizableCDNHosts } = useChatConfigContext();
    const { currentIndex } = useStateStore(imageGalleryStateStore.state, imageGallerySelector);

    const uri = useMemo(() => {
      return getResizedImageUrl({
        height: screenHeight,
        resizableCDNHosts,
        url: photo.uri,
        width: screenWidth,
      });
    }, [photo.uri, resizableCDNHosts, screenHeight, screenWidth]);

    const isSvg = useIsSvg(uri);
    const selected = currentIndex === index;
    const previous = currentIndex > index;
    const shouldRender = Math.abs(currentIndex - index) < 4;

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

    if (isSvg) {
      // The outer Animated.View is sized at 8× screen so raster images stay
      // crisp under pinch-zoom (see useAnimatedGalleryStyle). rn-svg on
      // Android rasterizes the SVG to a bitmap at its layout size, and an
      // 8×-screen bitmap exceeds RecordingCanvas's per-draw byte limit. The
      // inner View is 1× screen with a counter-scale of 8 so the bitmap stays
      // small while the composed visible scale (1/8 × 8 = 1) is unchanged.
      return (
        <Animated.View
          accessibilityLabel={accessibilityLabel}
          style={[...animatedStyles, style, styles.svgOuter]}
        >
          <View style={[{ height: screenHeight, width: screenWidth }, styles.svgInner]}>
            <SvgUri height='100%' uri={uri} width='100%' />
          </View>
        </Animated.View>
      );
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

const styles = StyleSheet.create({
  svgInner: {
    transform: [{ scale: 8 }],
  },
  svgOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
