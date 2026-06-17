import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ImageStyle, StyleProp } from 'react-native';
import Animated, { SharedValue } from 'react-native-reanimated';

import { useChatConfigContext } from '../../../contexts/chatConfigContext/ChatConfigContext';
import { useImageGalleryContext } from '../../../contexts/imageGalleryContext/ImageGalleryContext';
import { useStateStore } from '../../../hooks';
import { useIsSvg } from '../../../hooks/useIsSvg';
import {
  ImageGalleryAsset,
  ImageGalleryState,
} from '../../../state-store/image-gallery-state-store';
import { getResizedImageUrl } from '../../../utils/getResizedImageUrl';
import { SvgAwareImage } from '../../UIComponents/SvgAwareImage';
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
    const shouldRenderSelector = useCallback(
      (state: ImageGalleryState) => ({
        shouldRender: Math.abs(state.currentIndex - index) < 4,
      }),
      [index],
    );
    const { shouldRender } = useStateStore(imageGalleryStateStore.state, shouldRenderSelector);

    const uri = useMemo(() => {
      return getResizedImageUrl({
        height: screenHeight,
        resizableCDNHosts,
        url: photo.uri,
        width: screenWidth,
      });
    }, [photo.uri, resizableCDNHosts, screenHeight, screenWidth]);

    const isSvg = useIsSvg(uri);

    const animatedStyles = useAnimatedGalleryStyle({
      currentIndexShared: imageGalleryStateStore.currentIndexShared,
      index,
      offsetScale,
      scale,
      screenHeight,
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
      // crisp under pinch zoom (see useAnimatedGalleryStyle). rn-svg on
      // Android rasterizes the SVG to a bitmap at its layout size and an
      // 8x screen bitmap exceeds RecordingCanvas's per draw byte limit. The
      // inner SvgAwareImage is sized at 1x screen with a counter scale of 8 so
      // the bitmap stays small while the composed visible scale (1/8 × 8 === 1)
      // is unchanged.
      return (
        <Animated.View
          accessibilityLabel={accessibilityLabel}
          style={[...animatedStyles, style, styles.svgOuter]}
        >
          <SvgAwareImage
            source={{ uri }}
            style={[{ height: screenHeight, width: screenWidth }, styles.svgInner]}
          />
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
