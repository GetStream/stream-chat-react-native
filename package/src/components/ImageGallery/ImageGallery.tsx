import React, { useCallback, useEffect, useState } from 'react';
import { Image, ImageStyle, StyleSheet, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import Animated, {
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedGalleryImage } from './components/AnimatedGalleryImage';
import { AnimatedGalleryVideo } from './components/AnimatedGalleryVideo';

import { useImageGalleryGestures } from './hooks/useImageGalleryGestures';

import {
  ImageGalleryProviderProps,
  useImageGalleryContext,
} from '../../contexts/imageGalleryContext/ImageGalleryContext';
import {
  OverlayContextValue,
  useOverlayContext,
} from '../../contexts/overlayContext/OverlayContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStateStore } from '../../hooks';
import { useViewport } from '../../hooks/useViewport';
import { IconProps } from '../../icons/utils/base';
import { ImageGalleryState } from '../../state-store/image-gallery-state-store';
import { FileTypes } from '../../types/types';
import { dismissKeyboard } from '../KeyboardCompatibleView/KeyboardControllerAvoidingView';
import { BottomSheetModal } from '../UIComponents';

export type ImageGalleryActionHandler = () => Promise<void> | void;

export type ImageGalleryActionItem = {
  action: ImageGalleryActionHandler;
  Icon: React.ComponentType<IconProps>;
  id: 'showInChat' | 'save' | 'reply' | 'delete' | string;
  label: string;
  type: 'destructive' | 'standard';
};

const MARGIN = 32;

export enum HasPinched {
  FALSE = 0,
  TRUE,
}

export enum IsSwiping {
  UNDETERMINED = 0,
  TRUE,
  FALSE,
}

const imageGallerySelector = (state: ImageGalleryState) => ({
  assets: state.assets,
  currentIndex: state.currentIndex,
});

type ImageGalleryWithContextProps = Pick<
  ImageGalleryProviderProps,
  | 'numberOfImageGalleryGridColumns'
  | 'ImageGalleryHeader'
  | 'ImageGalleryFooter'
  | 'ImageGalleryVideoControls'
  | 'ImageGalleryGrid'
> &
  Pick<OverlayContextValue, 'overlayOpacity'>;

export const ImageGalleryWithContext = (props: ImageGalleryWithContextProps) => {
  const {
    numberOfImageGalleryGridColumns,
    overlayOpacity,
    ImageGalleryHeader,
    ImageGalleryFooter,
    ImageGalleryVideoControls,
    ImageGalleryGrid,
  } = props;
  const [isGridViewVisible, setIsGridViewVisible] = useState(false);
  const {
    theme: {
      colors: { white_snow },
      imageGallery: { backgroundColor, pager, slide },
    },
  } = useTheme();
  const { imageGalleryStateStore } = useImageGalleryContext();
  const { assets, currentIndex } = useStateStore(
    imageGalleryStateStore.state,
    imageGallerySelector,
  );
  const { videoPlayerPool } = imageGalleryStateStore;

  const { vh, vw } = useViewport();

  const fullWindowHeight = vh(100);
  const fullWindowWidth = vw(100);
  const halfScreenWidth = fullWindowWidth / 2;

  const halfScreenHeight = fullWindowHeight / 2;
  const quarterScreenHeight = fullWindowHeight / 4;

  /**
   * Fade animation for screen, it is always rendered with pointerEvents
   * set to none for fast opening
   */
  const screenTranslateY = useSharedValue(fullWindowHeight);
  const showScreen = useCallback(() => {
    'worklet';
    screenTranslateY.value = withTiming(0, {
      duration: 250,
      easing: Easing.out(Easing.ease),
    });
  }, [screenTranslateY]);

  /**
   * Run the fade animation on visible change
   */
  useEffect(() => {
    dismissKeyboard();
    showScreen();
  }, [showScreen]);

  /**
   * Image height from URL or default to full screen height
   */
  const [currentImageHeight, setCurrentImageHeight] = useState<number>(fullWindowHeight);

  /**
   * Header visible value for animating in out
   */
  const headerFooterVisible = useSharedValue(1);

  /**
   * Shared values for movement
   */
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const offsetScale = useSharedValue(1);
  const scale = useSharedValue(1);
  const translationX = useSharedValue(-(fullWindowWidth + MARGIN) * currentIndex);

  useAnimatedReaction(
    () => currentIndex,
    (index) => {
      translationX.value = -(fullWindowWidth + MARGIN) * index;
    },
    [currentIndex, fullWindowWidth],
  );

  /**
   * Image heights are not provided and therefore need to be calculated.
   * We start by allowing the image to be the full height then reduce it
   * to the proper scaled height based on the width being restricted to the
   * screen width when the dimensions are received.
   */
  useEffect(() => {
    let currentImageHeight = fullWindowHeight;
    const photo = assets[currentIndex];
    const height = photo?.original_height;
    const width = photo?.original_width;

    if (height && width) {
      const imageHeight = Math.floor(height * (fullWindowWidth / width));
      currentImageHeight = imageHeight > fullWindowHeight ? fullWindowHeight : imageHeight;
    } else if (photo?.uri) {
      if (photo.type === FileTypes.Image) {
        Image.getSize(photo.uri, (width, height) => {
          const imageHeight = Math.floor(height * (fullWindowWidth / width));
          currentImageHeight = imageHeight > fullWindowHeight ? fullWindowHeight : imageHeight;
        });
      }
    }

    setCurrentImageHeight(currentImageHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  // If you change the current index, pause the active video player.
  useEffect(() => {
    const activePlayer = videoPlayerPool.getActivePlayer();

    if (activePlayer) {
      activePlayer.pause();
    }
  }, [currentIndex, videoPlayerPool]);

  const { doubleTap, pan, pinch, singleTap } = useImageGalleryGestures({
    currentImageHeight,
    halfScreenHeight,
    halfScreenWidth,
    headerFooterVisible,
    offsetScale,
    overlayOpacity,
    scale,
    screenHeight: fullWindowHeight,
    screenWidth: fullWindowWidth,
    translateX,
    translateY,
    translationX,
  });

  /**
   * If the header is visible we scale down the opacity of it as the
   * image is swiped downward
   */
  const headerFooterOpacity = useDerivedValue(
    () =>
      currentImageHeight * scale.value < fullWindowHeight && translateY.value > 0
        ? 1 - translateY.value / quarterScreenHeight
        : currentImageHeight * scale.value > fullWindowHeight &&
            translateY.value > (currentImageHeight / 2) * scale.value - halfScreenHeight
          ? 1 -
            (translateY.value - ((currentImageHeight / 2) * scale.value - halfScreenHeight)) /
              quarterScreenHeight
          : 1,
    [currentImageHeight],
  );

  /**
   * This transition and scaleX reverse lets use scroll right
   */
  const pagerStyle = useAnimatedStyle<ImageStyle>(
    () => ({
      transform: [
        { scaleX: 1 },
        {
          translateX: translationX.value,
        },
      ],
    }),
    [],
  );

  /**
   * Simple background color animation on Y movement
   */
  const containerBackground = useAnimatedStyle<ViewStyle>(
    () => ({
      backgroundColor: backgroundColor || white_snow,
      opacity: headerFooterOpacity.value,
    }),
    [headerFooterOpacity],
  );

  /**
   * Show screen style as component is always rendered we hide it
   * down and up and set opacity to 0 for good measure
   */
  const showScreenStyle = useAnimatedStyle<ViewStyle>(
    () => ({
      transform: [
        {
          translateY: screenTranslateY.value,
        },
      ],
    }),
    [],
  );

  /**
   * Functions toclose BottomSheetModal with image grid
   */
  const closeGridView = () => {
    setIsGridViewVisible(false);
  };

  /**
   * Function to open BottomSheetModal with image grid
   */
  const openGridView = () => {
    setIsGridViewVisible(true);
  };

  return (
    <Animated.View
      accessibilityLabel='Image Gallery'
      pointerEvents={'auto'}
      style={[StyleSheet.absoluteFillObject, showScreenStyle]}
    >
      <Animated.View style={[StyleSheet.absoluteFillObject, containerBackground]} />
      <GestureDetector gesture={Gesture.Simultaneous(singleTap, doubleTap, pinch, pan)}>
        <Animated.View style={StyleSheet.absoluteFillObject}>
          <Animated.View style={[styles.animatedContainer, pagerStyle, pager]}>
            {assets.map((photo, i) =>
              photo.type === FileTypes.Video ? (
                <AnimatedGalleryVideo
                  attachmentId={photo.id}
                  index={i}
                  key={photo.id}
                  offsetScale={offsetScale}
                  photo={photo}
                  scale={scale}
                  screenHeight={fullWindowHeight}
                  style={[
                    {
                      height: fullWindowHeight * 8,
                      marginRight: MARGIN,
                      width: fullWindowWidth * 8,
                    },
                    slide,
                  ]}
                  translateX={translateX}
                  translateY={translateY}
                />
              ) : (
                <AnimatedGalleryImage
                  accessibilityLabel={'Image Item'}
                  index={i}
                  key={photo.id}
                  offsetScale={offsetScale}
                  photo={photo}
                  scale={scale}
                  screenHeight={fullWindowHeight}
                  screenWidth={fullWindowWidth}
                  style={[
                    {
                      height: fullWindowHeight * 8,
                      marginRight: MARGIN,
                      width: fullWindowWidth * 8,
                    },
                    slide,
                  ]}
                  translateX={translateX}
                  translateY={translateY}
                />
              ),
            )}
          </Animated.View>
        </Animated.View>
      </GestureDetector>
      {ImageGalleryHeader ? (
        <ImageGalleryHeader opacity={headerFooterOpacity} visible={headerFooterVisible} />
      ) : null}

      {ImageGalleryFooter ? (
        <ImageGalleryFooter
          accessibilityLabel={'Image Gallery Footer'}
          opacity={headerFooterOpacity}
          openGridView={openGridView}
          visible={headerFooterVisible}
          ImageGalleryVideoControls={ImageGalleryVideoControls}
        />
      ) : null}

      <BottomSheetModal
        height={350}
        onClose={() => {
          setIsGridViewVisible(false);
        }}
        visible={isGridViewVisible}
      >
        {ImageGalleryGrid ? (
          <ImageGalleryGrid
            closeGridView={closeGridView}
            numberOfImageGalleryGridColumns={numberOfImageGalleryGridColumns}
          />
        ) : null}
      </BottomSheetModal>
    </Animated.View>
  );
};

export type ImageGalleryProps = Partial<ImageGalleryWithContextProps>;

export const ImageGallery = (props: ImageGalleryProps) => {
  const {
    numberOfImageGalleryGridColumns,
    ImageGalleryHeader,
    ImageGalleryFooter,
    ImageGalleryVideoControls,
    ImageGalleryGrid,
  } = useImageGalleryContext();
  const { overlayOpacity } = useOverlayContext();
  return (
    <ImageGalleryWithContext
      numberOfImageGalleryGridColumns={numberOfImageGalleryGridColumns}
      overlayOpacity={overlayOpacity}
      ImageGalleryHeader={ImageGalleryHeader}
      ImageGalleryFooter={ImageGalleryFooter}
      ImageGalleryVideoControls={ImageGalleryVideoControls}
      ImageGalleryGrid={ImageGalleryGrid}
      {...props}
    />
  );
};

/**
 * Clamping worklet to clamp the scaling
 */
export const clamp = (value: number, lowerBound: number, upperBound: number) => {
  'worklet';
  return Math.min(Math.max(lowerBound, value), upperBound);
};

const styles = StyleSheet.create({
  animatedContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});

ImageGallery.displayName = 'ImageGallery{imageGallery}';
