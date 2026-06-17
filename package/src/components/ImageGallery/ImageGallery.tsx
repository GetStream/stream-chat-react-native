import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, ImageStyle, Platform, StyleSheet, ViewStyle } from 'react-native';
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
import type {
  ImageGalleryFooterProps,
  ImageGalleryGridProps,
  ImageGalleryHeaderProps,
} from './components/types';

import { useCurrentImageHeight } from './hooks/useCurrentImageHeight';
import { useImageGalleryGestures } from './hooks/useImageGalleryGestures';

import { useA11yLabel } from '../../a11y/hooks/useA11yLabel';
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
  currentIndex: state.currentIndex,
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
  const { assets, currentIndex } = useStateStore(
    imageGalleryStateStore.state,
    imageGallerySelector,
  );
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
   * Image height for the currently selected asset. SharedValue so worklet
   * consumers (gesture math, header/footer opacity) read it directly on the
   * UI thread so updating it doesn't trigger a parent rerender. The hook
   * owns the value and updates it via a store subscription.
   */
  const currentImageHeight = useCurrentImageHeight({
    assets,
    fullWindowHeight,
    fullWindowWidth,
    imageGalleryStateStore,
  });

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

  /**
   * If the header is visible we scale down the opacity of it as the
   * image is swiped downward. Reads currentImageHeight from a SharedValue so
   * the worklet doesn't need to be re-registered when the image dimensions
   * change between slides.
   */
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
      backgroundColor: backgroundColor || semantics.backgroundCoreApp,
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

  const { enabled: isAccessibilityEnabled } = useAccessibilityContext();
  const assetsCount = assets.length;
  const isAdjustable = isAccessibilityEnabled;
  const accessibilityValueParams = useMemo(
    () => ({ count: assetsCount, position: currentIndex + 1 }),
    [currentIndex, assetsCount],
  );
  const accessibilityValueText = useA11yLabel(
    'a11y/{{position}} of {{count}}',
    accessibilityValueParams,
  );
  const accessibilityValue = useMemo(
    () => (accessibilityValueText ? { text: accessibilityValueText } : undefined),
    [accessibilityValueText],
  );
  const adjustableActions = useMemo(
    () =>
      isAdjustable ? [{ name: 'increment' as const }, { name: 'decrement' as const }] : undefined,
    [isAdjustable],
  );

  const onAccessibilityAction = useCallback(
    (event: { nativeEvent: { actionName: string } }) => {
      if (!isAccessibilityEnabled) return;
      const latest = imageGalleryStateStore.state.getLatestValue();
      const latestCount = latest.assets.length;
      const latestIndex = latest.currentIndex;
      if (latestCount <= 1) return;
      if (event.nativeEvent.actionName === 'increment') {
        if (latestIndex < latestCount - 1) {
          imageGalleryStateStore.currentIndex = latestIndex + 1;
        }
      } else if (event.nativeEvent.actionName === 'decrement') {
        if (latestIndex > 0) {
          imageGalleryStateStore.currentIndex = latestIndex - 1;
        }
      }
    },
    [imageGalleryStateStore, isAccessibilityEnabled],
  );

  useEffect(() => {
    return () => {
      const handle = imageGalleryStateStore.requesterNode;
      if (handle == null) return;
      imageGalleryStateStore.requesterNode = null;
      // Because of the fact that iOS and Android handle supressing
      // the content underneath differently, we have to wait a frame
      // before iOS is allowed to attempt to refocus (it takes a frame
      // for the native a11y tree to become aware that it no longer has
      // an accessibilityViewIsModal sibling).
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
      <Animated.View
        accessible
        accessibilityActions={adjustableActions}
        accessibilityLabel='Image Gallery'
        accessibilityRole={isAdjustable ? 'adjustable' : undefined}
        accessibilityValue={isAdjustable ? accessibilityValue : undefined}
        onAccessibilityAction={isAdjustable ? onAccessibilityAction : undefined}
        style={[StyleSheet.absoluteFill, containerBackground]}
      />
      <GestureDetector gesture={Gesture.Simultaneous(singleTap, doubleTap, pinch, pan)}>
        <Animated.View style={StyleSheet.absoluteFill}>
          <Animated.View
            testID='image-gallery-pager'
            style={[styles.animatedContainer, pagerStyle, pager]}
          >
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
 * Clamping worklet to clamp the scaling
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
