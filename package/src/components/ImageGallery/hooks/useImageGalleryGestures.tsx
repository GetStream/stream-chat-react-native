import { useRef } from 'react';
import { Platform } from 'react-native';
import { Gesture, GestureType } from 'react-native-gesture-handler';
import {
  cancelAnimation,
  Easing,
  ReduceMotion,
  runOnJS,
  SharedValue,
  useSharedValue,
  withDecay,
  withTiming,
} from 'react-native-reanimated';

import { useImageGalleryContext } from '../../../contexts/imageGalleryContext/ImageGalleryContext';
import { useOverlayContext } from '../../../contexts/overlayContext/OverlayContext';
import { NativeHandlers } from '../../../native';

export enum HasPinched {
  FALSE = 0,
  TRUE,
}

export enum IsSwiping {
  UNDETERMINED = 0,
  TRUE,
  FALSE,
}

const MARGIN = 32;

export const useImageGalleryGestures = ({
  currentImageHeight,
  halfScreenHeight,
  halfScreenWidth,
  headerFooterVisible,
  offsetScale,
  overlayOpacity,
  scale,
  screenHeight,
  screenWidth,
  translateX,
  translateY,
  translationX,
}: {
  currentImageHeight: SharedValue<number>;
  halfScreenHeight: number;
  halfScreenWidth: number;
  headerFooterVisible: SharedValue<number>;
  offsetScale: SharedValue<number>;
  overlayOpacity: SharedValue<number>;
  scale: SharedValue<number>;
  screenHeight: number;
  screenWidth: number;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  translationX: SharedValue<number>;
}) => {
  const { imageGalleryStateStore } = useImageGalleryContext();
  const currentIndexShared = imageGalleryStateStore.currentIndexShared;

  const doubleTapRef = useRef<GestureType | undefined>(undefined);
  const panRef = useRef<GestureType | undefined>(undefined);
  const pinchRef = useRef<GestureType | undefined>(undefined);
  const singleTapRef = useRef<GestureType | undefined>(undefined);
  const { overlay, setOverlay } = useOverlayContext();
  const isAndroid = Platform.OS === 'android';

  const hasHitBottomScale = useSharedValue(1);
  const hasHitTopScale = useSharedValue(0);

  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const oldFocalX = useSharedValue(0);
  const oldFocalY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  const focalOffsetX = useSharedValue(0);
  const focalOffsetY = useSharedValue(0);
  const adjustedFocalX = useSharedValue(0);
  const adjustedFocalY = useSharedValue(0);
  const tapX = useSharedValue(0);
  const tapY = useSharedValue(0);

  const numberOfPinchFingers = useSharedValue(0);
  const isSwiping = useSharedValue(0);
  const isPinch = useSharedValue(false);
  const hasPinched = useSharedValue(0);

  const resetTouchValues = () => {
    'worklet';
    focalX.value = 0;
    focalY.value = 0;
    oldFocalX.value = 0;
    oldFocalY.value = 0;
    originX.value = 0;
    originY.value = 0;
    focalOffsetX.value = 0;
    focalOffsetY.value = 0;
    numberOfPinchFingers.value = 0;
    isPinch.value = false;
    isSwiping.value = IsSwiping.UNDETERMINED;
  };

  const resetMovementValues = () => {
    'worklet';
    translateX.value = 0;
    translateY.value = 0;
    scale.value = 1;
    offsetScale.value = 1;
  };

  const assetsLength = imageGalleryStateStore.assets.length;

  const clearImageGallery = () => {
    runOnJS(setOverlay)('none');
  };

  const moveToNextImage = () => {
    // Read fresh: this runs through `runOnJS` from a worklet, so a value captured when the hook
    // ran would be stale. The setter also updates `currentIndexShared`.
    const currentIndex = imageGalleryStateStore.state.getLatestValue().currentIndex;
    imageGalleryStateStore.currentIndex = currentIndex + 1;
  };

  const moveToPreviousImage = () => {
    const currentIndex = imageGalleryStateStore.state.getLatestValue().currentIndex;
    imageGalleryStateStore.currentIndex = currentIndex - 1;
  };

  /**
   * Pan and pinch run simultaneously. Once the pinch starts, `isPinch` blocks every pan handler
   * until the pinch ends.
   */
  const pan = Gesture.Pan()
    .enabled(overlay === 'gallery')
    .maxPointers(isAndroid ? 0 : 1)
    .minDistance(10)
    .onStart(() => {
      if (!isPinch.value) {
        // Interrupt running animations so the touch takes over the position.
        cancelAnimation(translateX);
        cancelAnimation(translateY);
        cancelAnimation(scale);
        offsetX.value = translateX.value;
        offsetY.value = translateY.value;
      }

      // Android: clears the flag that makes pan rebase its offsets after a pinch drops to one
      // finger.
      hasPinched.value = HasPinched.FALSE;
    })
    .onChange((event) => {
      if (event.numberOfPointers === 1 && !isPinch.value) {
        // Android: when a pinch drops to one finger, control returns to pan. Rebase the offsets and
        // stop treating the touch as a swipe.
        if (isAndroid && hasPinched.value === HasPinched.TRUE) {
          hasPinched.value = HasPinched.FALSE;
          isSwiping.value = IsSwiping.FALSE;
          offsetX.value = translateX.value + event.translationX;
          offsetY.value = translateY.value - event.translationY;
        }

        // `IsSwiping.TRUE` locks Y movement once a horizontal drag starts at the left or right edge
        // of the photo. `IsSwiping.FALSE` is set when the vertical translation exceeds 25. Reset on
        // touch release.
        if (isSwiping.value === IsSwiping.UNDETERMINED) {
          const maxXYRatio = 0.25;
          if (
            Math.abs(event.translationX / event.translationY) > maxXYRatio &&
            (Math.abs(-halfScreenWidth * (scale.value - 1) - offsetX.value) < 3 ||
              Math.abs(halfScreenWidth * (scale.value - 1) - offsetX.value) < 3)
          ) {
            isSwiping.value = IsSwiping.TRUE;
          }
          if (Math.abs(event.translationY) > 25) {
            isSwiping.value = IsSwiping.FALSE;
          }
        }

        // Scale relative to the scale when the gesture started. Also drives the overlay opacity.
        const localEvtScale = scale.value / offsetScale.value;

        // X always follows the touch. Y is frozen while swiping. The offsets are rescaled by
        // `localEvtScale` while the swipe-away scaling is active (approximate).
        translateX.value =
          scale.value !== offsetScale.value
            ? offsetX.value * localEvtScale + event.translationX
            : offsetX.value + event.translationX;
        translateY.value =
          isSwiping.value !== IsSwiping.TRUE
            ? scale.value !== offsetScale.value
              ? offsetY.value * localEvtScale + event.translationY
              : offsetY.value + event.translationY
            : translateY.value;

        // Swipe away: shrink the image as it is dragged down.
        const imageHeight = currentImageHeight.value;
        scale.value =
          imageHeight * offsetScale.value < screenHeight && translateY.value > 0
            ? offsetScale.value * (1 - (1 / 3) * (translateY.value / screenHeight))
            : imageHeight * offsetScale.value > screenHeight &&
                translateY.value > (imageHeight / 2) * offsetScale.value - halfScreenHeight
              ? offsetScale.value *
                (1 -
                  (1 / 3) *
                    ((translateY.value -
                      ((imageHeight / 2) * offsetScale.value - halfScreenHeight)) /
                      screenHeight))
              : scale.value;

        overlayOpacity.value = localEvtScale;
      }
    })
    .onEnd((event) => {
      if (!isPinch.value && event.numberOfPointers < 2) {
        // Translation combined with weighted velocity: decides paging and dismissal.
        const finalXPosition = event.translationX - event.velocityX * 0.3;
        const finalYPosition = event.translationY + event.velocityY * 0.1;

        const currentIndex = currentIndexShared.value;

        // Page to the next image: a left swipe (`translateX` negative) at the photo's right edge
        // with `finalXPosition` beyond half the screen width.
        if (
          currentIndex < assetsLength - 1 &&
          Math.abs(halfScreenWidth * (scale.value - 1) + offsetX.value) < 3 &&
          translateX.value < 0 &&
          finalXPosition > halfScreenWidth &&
          isSwiping.value === IsSwiping.TRUE
        ) {
          cancelAnimation(translationX);
          translationX.value = withTiming(
            -(screenWidth + MARGIN) * (currentIndex + 1),
            {
              duration: 200,
              easing: Easing.out(Easing.ease),
            },
            () => {
              resetMovementValues();
              runOnJS(moveToNextImage)();
            },
          );
        } else if (
          currentIndex > 0 &&
          Math.abs(-halfScreenWidth * (scale.value - 1) + offsetX.value) < 3 &&
          translateX.value > 0 &&
          finalXPosition < -halfScreenWidth &&
          isSwiping.value === IsSwiping.TRUE
        ) {
          // Page to the previous image: a right swipe (`translateX` positive) at the photo's left
          // edge with `finalXPosition` beyond half the screen width.
          cancelAnimation(translationX);
          translationX.value = withTiming(
            -(screenWidth + MARGIN) * (currentIndex - 1),
            {
              duration: 200,
              easing: Easing.out(Easing.ease),
            },
            () => {
              resetMovementValues();
              runOnJS(moveToPreviousImage)();
            },
          );
        }

        // Settle X: center when zoomed out, snap back inside the edges, otherwise decay clamped to
        // the edges.
        translateX.value =
          scale.value < 1
            ? withTiming(0)
            : translateX.value > halfScreenWidth * (scale.value - 1)
              ? withTiming(halfScreenWidth * (scale.value - 1), {
                  duration: 200,
                })
              : translateX.value < -halfScreenWidth * (scale.value - 1)
                ? withTiming(-halfScreenWidth * (scale.value - 1), {
                    duration: 200,
                  })
                : withDecay({
                    clamp: [
                      -halfScreenWidth * (scale.value - 1),
                      halfScreenWidth * (scale.value - 1),
                    ],
                    deceleration: 0.99,
                    velocity: -event.velocityX,
                  });

        // Settle Y: same as X, comparing the scaled image height with the screen height.
        const imageHeight = currentImageHeight.value;
        translateY.value =
          imageHeight * scale.value < screenHeight
            ? withTiming(0, { reduceMotion: ReduceMotion.Never })
            : translateY.value > (imageHeight / 2) * scale.value - halfScreenHeight
              ? withTiming((imageHeight / 2) * scale.value - halfScreenHeight, {
                  reduceMotion: ReduceMotion.Never,
                })
              : translateY.value < (-imageHeight / 2) * scale.value + halfScreenHeight
                ? withTiming((-imageHeight / 2) * scale.value + halfScreenHeight)
                : withDecay({
                    clamp: [
                      (-imageHeight / 2) * scale.value + halfScreenHeight,
                      (imageHeight / 2) * scale.value - halfScreenHeight,
                    ],
                    deceleration: 0.99,
                    velocity: event.velocityY,
                  });

        resetTouchValues();

        // Restore the scale to `offsetScale`, undoing the swipe-away shrink.
        scale.value =
          scale.value !== offsetScale.value ? withTiming(offsetScale.value) : offsetScale.value;

        // Dismiss on a downward swipe: `finalYPosition` beyond half the screen, photo centered or
        // at its top edge, and not a horizontal page swipe.
        if (
          finalYPosition > halfScreenHeight &&
          offsetY.value + 8 >= (imageHeight / 2) * scale.value - halfScreenHeight &&
          isSwiping.value !== IsSwiping.TRUE &&
          translateY.value !== 0 &&
          !(
            Math.abs(halfScreenWidth * (scale.value - 1) + offsetX.value) < 3 &&
            translateX.value < 0 &&
            finalXPosition < -halfScreenWidth
          ) &&
          !(
            Math.abs(-halfScreenWidth * (scale.value - 1) + offsetX.value) < 3 &&
            translateX.value > 0 &&
            finalXPosition > halfScreenWidth
          )
        ) {
          cancelAnimation(translateX);
          cancelAnimation(translateY);
          cancelAnimation(scale);

          overlayOpacity.value = withTiming(
            0,
            {
              duration: 200,
              easing: Easing.out(Easing.ease),
            },
            () => {
              runOnJS(clearImageGallery)();
            },
          );
          scale.value = withTiming(0.6, {
            duration: 200,
            easing: Easing.out(Easing.ease),
          });
          translateY.value =
            event.velocityY > 1000
              ? withDecay({
                  velocity: event.velocityY,
                })
              : withTiming(halfScreenHeight + (imageHeight / 2) * scale.value, {
                  duration: 200,
                  easing: Easing.out(Easing.ease),
                });
          translateX.value = withDecay({
            velocity: -event.velocityX,
          });
        }
      }
    })
    .simultaneousWithExternalGesture(pinchRef)
    .withRef(panRef);

  const triggerHaptic = NativeHandlers.triggerHaptic;

  /**
   * Takes over all touch handling once two fingers touch, even if the count drops to one, until
   * the touch ends.
   */
  const pinch = Gesture.Pinch()
    .onStart((event) => {
      // Android's first event has a single pointer, so the starting values are captured in
      // `onChange`.
      if (!isAndroid) {
        cancelAnimation(translateX);
        cancelAnimation(translateY);
        cancelAnimation(scale);

        isPinch.value = true;

        isSwiping.value = IsSwiping.UNDETERMINED;

        numberOfPinchFingers.value = event.numberOfPointers;
        offsetX.value = translateX.value;
        offsetY.value = translateY.value;
        adjustedFocalX.value = event.focalX - (halfScreenWidth - offsetX.value);
        adjustedFocalY.value = event.focalY - (halfScreenHeight + offsetY.value);
        originX.value = adjustedFocalX.value;
        originY.value = adjustedFocalY.value;
        offsetScale.value = scale.value;
      }

      hasPinched.value = HasPinched.FALSE;
    })
    .onChange((event) => {
      // Android's first event has a single pointer, so the starting values are captured here.
      if (!isPinch.value && isAndroid) {
        // Lets pan rebase its offsets when a finger is removed.
        hasPinched.value = HasPinched.TRUE;

        cancelAnimation(translateX);
        cancelAnimation(translateY);
        cancelAnimation(scale);

        isSwiping.value = IsSwiping.UNDETERMINED;

        numberOfPinchFingers.value = event.numberOfPointers;
        offsetX.value = translateX.value;
        offsetY.value = translateY.value;
        adjustedFocalX.value = event.focalX - (halfScreenWidth - offsetX.value);
        adjustedFocalY.value = event.focalY - (halfScreenHeight + offsetY.value);
        originX.value = adjustedFocalX.value;
        originY.value = adjustedFocalY.value;
        offsetScale.value = scale.value;
      }

      // On Android this is the first place `isPinch` becomes true.
      isPinch.value = true;

      // Scale is clamped to 1..8. The clamped value, not `event.scale`, drives `localEvtScale` so
      // the focal point stays in sync with the actual photo scale.
      scale.value = clamp(offsetScale.value * event.scale, 1, 8);
      const localEvtScale = scale.value / offsetScale.value;

      // Light haptic once each time the scale reaches a limit.
      if (scale.value !== 8 && scale.value !== 1) {
        hasHitTopScale.value = 0;
        hasHitBottomScale.value = 0;
      } else if (scale.value === 8 && hasHitTopScale.value === 0) {
        hasHitTopScale.value = 1;
        runOnJS(triggerHaptic)('impactLight');
      } else if (scale.value === 1 && hasHitBottomScale.value === 0) {
        hasHitBottomScale.value = 1;
        runOnJS(triggerHaptic)('impactLight');
      }

      // Focal point adjusted for the screen size and photo offset.
      adjustedFocalX.value = event.focalX - (halfScreenWidth - offsetX.value);
      adjustedFocalY.value = event.focalY - (halfScreenHeight + offsetY.value);

      // The focal point jumps when the finger count changes. Dropping to one finger stores the
      // difference from the previous focal as `focalOffset`. Adding a finger shifts the origin by
      // the difference.
      if (numberOfPinchFingers.value !== event.numberOfPointers) {
        numberOfPinchFingers.value = event.numberOfPointers;
        if (event.numberOfPointers === 1) {
          focalOffsetX.value = oldFocalX.value - adjustedFocalX.value;
          focalOffsetY.value = oldFocalY.value - adjustedFocalY.value;
        } else if (numberOfPinchFingers.value > 1) {
          originX.value =
            originX.value -
            (oldFocalX.value / localEvtScale - adjustedFocalX.value / localEvtScale);
          originY.value =
            originY.value -
            (oldFocalY.value / localEvtScale - adjustedFocalY.value / localEvtScale);
        }
      }

      // One finger left: apply the saved focal offset so the photo does not jump.
      if (numberOfPinchFingers.value === 1) {
        oldFocalX.value = adjustedFocalX.value + focalOffsetX.value;
        oldFocalY.value = adjustedFocalY.value + focalOffsetY.value;
        translateX.value = offsetX.value - oldFocalX.value + localEvtScale * originX.value;
        translateY.value = offsetY.value + oldFocalY.value - localEvtScale * originY.value;
      } else if (numberOfPinchFingers.value > 1) {
        // Two or more fingers: remember this focal for the next finger-count change.
        oldFocalX.value = adjustedFocalX.value;
        oldFocalY.value = adjustedFocalY.value;
        translateX.value = offsetX.value - adjustedFocalX.value + localEvtScale * originX.value;
        translateY.value = offsetY.value + adjustedFocalY.value - localEvtScale * originY.value;
      }
    })
    .onEnd(() => {
      if (isPinch.value) {
        // Snap back inside the edges; otherwise keep the position.
        translateX.value =
          scale.value < 1
            ? withTiming(0)
            : translateX.value > halfScreenWidth * (scale.value - 1)
              ? withTiming(halfScreenWidth * (scale.value - 1))
              : translateX.value < -halfScreenWidth * (scale.value - 1)
                ? withTiming(-halfScreenWidth * (scale.value - 1))
                : translateX.value;

        const imageHeight = currentImageHeight.value;
        translateY.value =
          imageHeight * scale.value < screenHeight
            ? withTiming(0)
            : translateY.value > (imageHeight / 2) * scale.value - screenHeight / 2
              ? withTiming((imageHeight / 2) * scale.value - screenHeight / 2)
              : translateY.value < (-imageHeight / 2) * scale.value + screenHeight / 2
                ? withTiming((-imageHeight / 2) * scale.value + screenHeight / 2)
                : translateY.value;

        // Commit the final scale as `offsetScale` for the next gesture, never below 1.
        offsetScale.value = scale.value < 1 ? 1 : scale.value;
        scale.value = scale.value < 1 ? withTiming(1) : scale.value;
        resetTouchValues();
      }
    })
    .withRef(pinchRef)
    .simultaneousWithExternalGesture(panRef);

  const singleTap = Gesture.Tap()
    .minPointers(1)
    .numberOfTaps(1)
    .onEnd(() => {
      cancelAnimation(headerFooterVisible);
      headerFooterVisible.value = headerFooterVisible.value > 0 ? withTiming(0) : withTiming(1);
    })
    .requireExternalGestureToFail(panRef, pinchRef, doubleTapRef)
    .withRef(singleTapRef);

  /**
   * Toggles between 2x zoom and 1x. Zooming back to 1x also hides the header and footer.
   */
  const doubleTap = Gesture.Tap()
    .maxDeltaX(8)
    .maxDeltaY(8)
    .maxDistance(8)
    .minPointers(1)
    .numberOfTaps(2)
    .onStart((event) => {
      tapX.value = event.absoluteX;
      tapY.value = event.absoluteY;
    })
    .onEnd((event) => {
      if (
        Math.abs(tapX.value - event.absoluteX) < 64 &&
        Math.abs(tapY.value - event.absoluteY) < 64
      ) {
        if (offsetScale.value === 1 && offsetX.value === 0 && offsetY.value === 0) {
          offsetScale.value = 2;
          scale.value = withTiming(2, {
            duration: 200,
            easing: Easing.out(Easing.ease),
          });
          translateX.value = withTiming(event.absoluteX - halfScreenWidth, {
            duration: 200,
            easing: Easing.out(Easing.ease),
          });
          const imageHeight = currentImageHeight.value;
          if (imageHeight * 2 > screenHeight) {
            const translateYTopBottom =
              event.absoluteY > halfScreenHeight
                ? -(imageHeight * 2 - screenHeight) / 2
                : (imageHeight * 2 - screenHeight) / 2;
            translateY.value = withTiming(translateYTopBottom, {
              duration: 200,
              easing: Easing.out(Easing.ease),
            });
          }
        } else {
          offsetScale.value = 1;
          scale.value = withTiming(1, {
            duration: 200,
            easing: Easing.out(Easing.ease),
          });
          offsetX.value = 0;
          offsetY.value = 0;
          translateX.value = withTiming(0, {
            duration: 200,
            easing: Easing.out(Easing.ease),
          });
          translateY.value = withTiming(0, {
            duration: 200,
            easing: Easing.out(Easing.ease),
          });
          if (headerFooterVisible.value !== 0) {
            cancelAnimation(headerFooterVisible);
            headerFooterVisible.value = withTiming(0);
          }
        }
      }
    })
    .withRef(doubleTapRef);

  return {
    doubleTap,
    pan,
    pinch,
    singleTap,
  };
};

/**
 * Clamps `value` between `lowerBound` and `upperBound`.
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
