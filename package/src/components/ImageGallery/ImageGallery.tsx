import React, { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, ImageStyle, Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import Animated, {
  Easing,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedGalleryImage } from './components/AnimatedGalleryImage';
import { AnimatedGalleryVideo } from './components/AnimatedGalleryVideo';
import { ImageGalleryA11yProbe } from './components/ImageGalleryA11yProbe';
import type {
  ImageGalleryFooterProps,
  ImageGalleryGridProps,
  ImageGalleryHeaderProps,
} from './components/types';

import { useCurrentImageHeight } from './hooks/useCurrentImageHeight';
import { useImageGalleryGestures } from './hooks/useImageGalleryGestures';

import { useAccessibilityContext } from '../../contexts/accessibilityContext/AccessibilityContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
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
import { dismissKeyboard } from '../KeyboardCompatibleView/KeyboardCompatibleView';
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
});

type ImageGalleryWithContextProps = Pick<
  ImageGalleryProviderProps,
  'numberOfImageGalleryGridColumns'
> &
  Pick<OverlayContextValue, 'overlayOpacity'> & {
    ImageGalleryHeader?: React.ComponentType<ImageGalleryHeaderProps>;
    ImageGalleryFooter?: React.ComponentType<ImageGalleryFooterProps>;
    ImageGalleryGrid?: React.ComponentType<ImageGalleryGridProps>;
  };

/**
 * Number of slides mounted on each side of the current one. One more than the image load window in
 * `AnimatedGalleryImage`, so an edge slide is already mounted as a placeholder before it loads.
 */
const PAGER_WINDOW_RADIUS = 4;

const galleryPagerSelector = (state: ImageGalleryState) => ({
  assets: state.assets,
  currentIndex: state.currentIndex,
});

type GalleryPagerProps = {
  fullWindowHeight: number;
  fullWindowWidth: number;
  offsetScale: SharedValue<number>;
  scale: SharedValue<number>;
  slide?: ImageStyle;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
};

/**
 * The windowed slide list. It subscribes to `currentIndex` itself, so a page change re-renders only
 * this list and not the parent, which keeps the gesture objects stable.
 *
 * Only slides within {@link PAGER_WINDOW_RADIUS} of the current index are mounted. A leading spacer
 * takes the width of the skipped slides, so the mounted ones keep the natural positions that the
 * transforms in `useAnimatedGalleryStyle` depend on.
 */
const GalleryPager = (props: GalleryPagerProps) => {
  const { fullWindowHeight, fullWindowWidth, offsetScale, scale, slide, translateX, translateY } =
    props;
  const { imageGalleryStateStore } = useImageGalleryContext();
  const { assets, currentIndex } = useStateStore(
    imageGalleryStateStore.state,
    galleryPagerSelector,
  );

  const slideStyle = {
    height: fullWindowHeight * 8,
    marginRight: MARGIN,
    width: fullWindowWidth * 8,
  };

  const lo = Math.max(0, currentIndex - PAGER_WINDOW_RADIUS);
  const hi = Math.min(assets.length - 1, currentIndex + PAGER_WINDOW_RADIUS);

  const slides: React.ReactNode[] = [];
  for (let i = lo; i <= hi; i++) {
    const photo = assets[i];
    slides.push(
      photo.type === FileTypes.Video ? (
        <AnimatedGalleryVideo
          attachmentId={photo.id}
          index={i}
          key={photo.id}
          offsetScale={offsetScale}
          photo={photo}
          scale={scale}
          screenHeight={fullWindowHeight}
          style={[slideStyle, slide]}
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
          style={[slideStyle, slide]}
          translateX={translateX}
          translateY={translateY}
        />
      ),
    );
  }

  return (
    <>
      {lo > 0 ? (
        <View
          key='gallery-pager-leading-spacer'
          style={{ width: lo * (fullWindowWidth * 8 + MARGIN) }}
        />
      ) : null}
      {slides}
    </>
  );
};

export const ImageGalleryWithContext = (props: ImageGalleryWithContextProps) => {
  const {
    numberOfImageGalleryGridColumns,
    overlayOpacity,
    ImageGalleryHeader,
    ImageGalleryFooter,
    ImageGalleryGrid,
  } = props;
  const [isGridViewVisible, setIsGridViewVisible] = useState(false);
  const {
    theme: {
      imageGallery: { backgroundColor, pager, slide },
      semantics,
    },
  } = useTheme();
  const { imageGalleryStateStore } = useImageGalleryContext();
  const { assets } = useStateStore(imageGalleryStateStore.state, imageGallerySelector);
  const { vh, vw } = useViewport();

  const fullWindowHeight = vh(100);
  const fullWindowWidth = vw(100);
  const halfScreenWidth = fullWindowWidth / 2;

  const halfScreenHeight = fullWindowHeight / 2;
  const quarterScreenHeight = fullWindowHeight / 4;

  // Vertical offset of the whole screen: starts below the viewport and animates to 0.
  const screenTranslateY = useSharedValue(fullWindowHeight);
  const showScreen = useCallback(() => {
    'worklet';
    screenTranslateY.value = withTiming(0, {
      duration: 250,
      easing: Easing.out(Easing.ease),
    });
  }, [screenTranslateY]);

  useEffect(() => {
    dismissKeyboard();
    showScreen();
  }, [showScreen]);

  // Height of the current image. A SharedValue so worklets read it on the UI thread and updating
  // it does not re-render this component.
  const currentImageHeight = useCurrentImageHeight({
    assets,
    fullWindowHeight,
    fullWindowWidth,
    imageGalleryStateStore,
  });

  // Header and footer visibility: 1 shown, 0 hidden, animated between.
  const headerFooterVisible = useSharedValue(1);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const offsetScale = useSharedValue(1);
  const scale = useSharedValue(1);
  const translationX = useSharedValue(
    -(fullWindowWidth + MARGIN) * imageGalleryStateStore.state.getLatestValue().currentIndex,
  );

  const currentIndexShared = imageGalleryStateStore.currentIndexShared;

  useAnimatedReaction(
    () => currentIndexShared.value,
    (index) => {
      translationX.value = -(fullWindowWidth + MARGIN) * index;
    },
    [fullWindowWidth],
  );

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

  // Fades the header and footer as the image is dragged down. The height is read from a SharedValue
  // so the worklet is not re-registered when the image dimensions change between slides.
  const headerFooterOpacity = useDerivedValue(() => {
    const imageHeight = currentImageHeight.value;
    return imageHeight * scale.value < fullWindowHeight && translateY.value > 0
      ? 1 - translateY.value / quarterScreenHeight
      : imageHeight * scale.value > fullWindowHeight &&
          translateY.value > (imageHeight / 2) * scale.value - halfScreenHeight
        ? 1 -
          (translateY.value - ((imageHeight / 2) * scale.value - halfScreenHeight)) /
            quarterScreenHeight
        : 1;
  }, []);

  // Offsets the pager horizontally to the current slide.
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

  // Background that fades as the image is dragged down.
  const containerBackground = useAnimatedStyle<ViewStyle>(
    () => ({
      backgroundColor: backgroundColor || semantics.backgroundCoreApp,
      opacity: headerFooterOpacity.value,
    }),
    [headerFooterOpacity],
  );

  // Slides the screen in from below the viewport.
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

  const closeGridView = () => {
    setIsGridViewVisible(false);
  };

  const openGridView = () => {
    setIsGridViewVisible(true);
  };

  const { enabled: isAccessibilityEnabled } = useAccessibilityContext();

  useEffect(() => {
    return () => {
      const handle = imageGalleryStateStore.requesterNode;
      if (handle == null) return;
      imageGalleryStateStore.requesterNode = null;
      // iOS must wait a frame before refocusing: the native a11y tree takes a frame to notice that
      // the `accessibilityViewIsModal` sibling is gone. Android refocuses immediately.
      if (Platform.OS === 'android') {
        AccessibilityInfo.setAccessibilityFocus(handle);
      } else {
        requestAnimationFrame(() => {
          AccessibilityInfo.setAccessibilityFocus(handle);
        });
      }
    };
  }, [imageGalleryStateStore]);

  return (
    <Animated.View
      accessibilityViewIsModal
      pointerEvents={'auto'}
      style={[StyleSheet.absoluteFill, showScreenStyle]}
    >
      {isAccessibilityEnabled ? (
        <ImageGalleryA11yProbe containerBackground={containerBackground} />
      ) : (
        <Animated.View style={[StyleSheet.absoluteFill, containerBackground]} />
      )}
      <GestureDetector gesture={Gesture.Simultaneous(singleTap, doubleTap, pinch, pan)}>
        <Animated.View style={StyleSheet.absoluteFill}>
          <Animated.View
            testID='image-gallery-pager'
            style={[styles.animatedContainer, pagerStyle, pager]}
          >
            <GalleryPager
              fullWindowHeight={fullWindowHeight}
              fullWindowWidth={fullWindowWidth}
              offsetScale={offsetScale}
              scale={scale}
              slide={slide}
              translateX={translateX}
              translateY={translateY}
            />
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
  const { numberOfImageGalleryGridColumns } = useImageGalleryContext();
  const { ImageGalleryHeader, ImageGalleryFooter, ImageGalleryGrid } = useComponentsContext();
  const { overlayOpacity } = useOverlayContext();
  return (
    <ImageGalleryWithContext
      numberOfImageGalleryGridColumns={numberOfImageGalleryGridColumns}
      overlayOpacity={overlayOpacity}
      ImageGalleryHeader={ImageGalleryHeader}
      ImageGalleryFooter={ImageGalleryFooter}
      ImageGalleryGrid={ImageGalleryGrid}
      {...props}
    />
  );
};

/**
 * Clamps a value between two bounds. Runs as a worklet.
 *
 * @param value The value to clamp.
 * @param lowerBound The minimum result.
 * @param upperBound The maximum result.
 * @returns The clamped value.
 */
export const clamp = (value: number, lowerBound: number, upperBound: number) => {
  'worklet';
  return Math.min(Math.max(lowerBound, value), upperBound);
};

const styles = StyleSheet.create({
  animatedContainer: {
    alignItems: 'center',
    direction: 'ltr',
    flexDirection: 'row',
  },
});

ImageGallery.displayName = 'ImageGallery{imageGallery}';
