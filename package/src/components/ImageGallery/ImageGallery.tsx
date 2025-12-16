import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, ImageStyle, Keyboard, StyleSheet, ViewStyle } from 'react-native';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import Animated, {
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import BottomSheet from '@gorhom/bottom-sheet';
import type { UserResponse } from 'stream-chat';

import { AnimatedGalleryImage } from './components/AnimatedGalleryImage';
import { AnimatedGalleryVideo } from './components/AnimatedGalleryVideo';
import {
  ImageGalleryFooter,
  ImageGalleryFooterCustomComponentProps,
} from './components/ImageGalleryFooter';
import {
  ImageGalleryHeader,
  ImageGalleryHeaderCustomComponentProps,
} from './components/ImageGalleryHeader';
import { ImageGalleryOverlay } from './components/ImageGalleryOverlay';
import { ImageGalleryGridImageComponents, ImageGrid } from './components/ImageGrid';
import {
  ImageGalleryGridHandleCustomComponentProps,
  ImageGridHandle,
} from './components/ImageGridHandle';

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
import { ImageGalleryState } from '../../state-store/image-gallery-state-store';
import { FileTypes } from '../../types/types';

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

export type ImageGalleryCustomComponents = {
  /**
   * Override props for following UI components, which are part of [image gallery](https://github.com/GetStream/stream-chat-react-native/wiki/Cookbook-v3.0#gallery-components).
   *
   * - [ImageGalleryFooter](#ImageGalleryFooter)
   *
   * - [ImageGrid](#ImageGrid)
   *
   * - [ImageGridHandle](#ImageGridHandle)
   *
   * - [ImageGalleryHeader](#ImageGalleryHeader)
   *
   * e.g.,
   *
   * ```js
   * {
   *  footer: {
   *    ShareIcon: CustomShareIconComponent
   *  },
   *  grid: {
   *    avatarComponent: CustomAvatarComponent
   *  },
   *  gridHandle: {
   *    centerComponent: CustomCenterComponent
   *  },
   *  header: {
   *    CloseIcon: CustomCloseButtonComponent
   *  },
   * }
   * ```
   * @overrideType object
   */
  imageGalleryCustomComponents?: {
    footer?: ImageGalleryFooterCustomComponentProps;
    grid?: ImageGalleryGridImageComponents;
    gridHandle?: ImageGalleryGridHandleCustomComponentProps;
    header?: ImageGalleryHeaderCustomComponentProps;
  };
};

const imageGallerySelector = (state: ImageGalleryState) => ({
  currentIndex: state.currentIndex,
});

type ImageGalleryWithContextProps = Pick<
  ImageGalleryProviderProps,
  | 'imageGalleryCustomComponents'
  | 'imageGalleryGridSnapPoints'
  | 'imageGalleryGridHandleHeight'
  | 'numberOfImageGalleryGridColumns'
> &
  Pick<OverlayContextValue, 'overlayOpacity'>;

export const ImageGalleryWithContext = (props: ImageGalleryWithContextProps) => {
  const {
    imageGalleryGridHandleHeight,
    imageGalleryGridSnapPoints,
    imageGalleryCustomComponents,
    numberOfImageGalleryGridColumns,
    overlayOpacity,
  } = props;
  const {
    theme: {
      colors: { white_snow },
      imageGallery: { backgroundColor, pager, slide },
    },
  } = useTheme();
  const { imageGalleryStateStore } = useImageGalleryContext();
  const { currentIndex } = useStateStore(imageGalleryStateStore.state, imageGallerySelector);
  const { assets, videoPlayerPool } = imageGalleryStateStore;

  const { vh, vw } = useViewport();

  const fullWindowHeight = vh(100);
  const fullWindowWidth = vw(100);
  const halfScreenWidth = fullWindowWidth / 2;

  const halfScreenHeight = fullWindowHeight / 2;
  const quarterScreenHeight = fullWindowHeight / 4;
  const snapPoints = React.useMemo(
    () => [(fullWindowHeight * 3) / 4, fullWindowHeight - (imageGalleryGridHandleHeight ?? 0)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /**
   * BottomSheetModal ref
   */
  const bottomSheetModalRef = useRef<BottomSheet>(null);

  /**
   * BottomSheetModal state
   */
  const [currentBottomSheetIndex, setCurrentBottomSheetIndex] = useState(0);
  const animatedBottomSheetIndex = useSharedValue(0);

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
    Keyboard.dismiss();
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
    if (bottomSheetModalRef.current?.close) {
      bottomSheetModalRef.current.close();
    }
  };

  /**
   * Function to open BottomSheetModal with image grid
   */
  const openGridView = () => {
    if (bottomSheetModalRef.current?.snapToIndex) {
      bottomSheetModalRef.current.snapToIndex(0);
    }
  };

  const MemoizedImageGridHandle = useCallback(
    () => (
      <ImageGridHandle
        closeGridView={closeGridView}
        {...imageGalleryCustomComponents?.gridHandle}
      />
    ),
    [imageGalleryCustomComponents?.gridHandle],
  );

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
                  previous={currentIndex > i}
                  repeat={true}
                  scale={scale}
                  screenHeight={fullWindowHeight}
                  selected={currentIndex === i}
                  shouldRender={Math.abs(currentIndex - i) < 4}
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
                  previous={currentIndex > i}
                  scale={scale}
                  screenHeight={fullWindowHeight}
                  screenWidth={fullWindowWidth}
                  selected={currentIndex === i}
                  shouldRender={Math.abs(currentIndex - i) < 4}
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
      <ImageGalleryHeader
        opacity={headerFooterOpacity}
        visible={headerFooterVisible}
        {...imageGalleryCustomComponents?.header}
      />

      <ImageGalleryFooter
        accessibilityLabel={'Image Gallery Footer'}
        opacity={headerFooterOpacity}
        openGridView={openGridView}
        visible={headerFooterVisible}
        {...imageGalleryCustomComponents?.footer}
      />

      <ImageGalleryOverlay
        animatedBottomSheetIndex={animatedBottomSheetIndex}
        closeGridView={closeGridView}
        currentBottomSheetIndex={currentBottomSheetIndex}
      />
      <BottomSheet
        animatedIndex={animatedBottomSheetIndex}
        enablePanDownToClose={true}
        handleComponent={MemoizedImageGridHandle}
        // @ts-ignore
        handleHeight={imageGalleryGridHandleHeight}
        index={-1}
        onChange={(index: number) => setCurrentBottomSheetIndex(index)}
        ref={bottomSheetModalRef}
        snapPoints={imageGalleryGridSnapPoints || snapPoints}
      >
        <ImageGrid
          closeGridView={closeGridView}
          numberOfImageGalleryGridColumns={numberOfImageGalleryGridColumns}
          {...imageGalleryCustomComponents?.grid}
        />
      </BottomSheet>
    </Animated.View>
  );
};

export type ImageGalleryProps = Partial<ImageGalleryWithContextProps>;

export const ImageGallery = (props: ImageGalleryProps) => {
  const {
    imageGalleryCustomComponents,
    imageGalleryGridHandleHeight,
    imageGalleryGridSnapPoints,
    numberOfImageGalleryGridColumns,
  } = useImageGalleryContext();
  const { overlayOpacity } = useOverlayContext();
  return (
    <ImageGalleryWithContext
      imageGalleryCustomComponents={imageGalleryCustomComponents}
      imageGalleryGridHandleHeight={imageGalleryGridHandleHeight}
      imageGalleryGridSnapPoints={imageGalleryGridSnapPoints}
      numberOfImageGalleryGridColumns={numberOfImageGalleryGridColumns}
      overlayOpacity={overlayOpacity}
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

export type Photo = {
  id: string;
  uri: string;
  channelId?: string;
  created_at?: string | Date;
  messageId?: string;
  mime_type?: string;
  original_height?: number;
  original_width?: number;
  thumb_url?: string;
  type?: string;
  user?: UserResponse | null;
  user_id?: string;
};

ImageGallery.displayName = 'ImageGallery{imageGallery}';
