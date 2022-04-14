import { Platform } from 'react-native';
import type {
  PanGestureHandlerGestureEvent,
  PinchGestureHandlerGestureEvent,
  TapGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import {
  cancelAnimation,
  Easing,
  runOnJS,
  SharedValue,
  useAnimatedGestureHandler,
  useSharedValue,
  withDecay,
  withTiming,
} from 'react-native-reanimated';

import { useOverlayContext } from '../../../contexts/overlayContext/OverlayContext';
import { triggerHaptic } from '../../../native';

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
  photoLength,
  scale,
  screenHeight,
  screenWidth,
  setSelectedIndex,
  translateX,
  translateY,
  translationX,
}: {
  currentImageHeight: number;
  halfScreenHeight: number;
  halfScreenWidth: number;
  headerFooterVisible: SharedValue<number>;
  offsetScale: SharedValue<number>;
  overlayOpacity: SharedValue<number>;
  photoLength: number;
  scale: SharedValue<number>;
  screenHeight: number;
  screenWidth: number;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  translationX: SharedValue<number>;
}) => {
  const { setOverlay } = useOverlayContext();
  const isAndroid = Platform.OS === 'android';

  /**
   * Values to track scale for haptic feedback firing
   */
  const hasHitBottomScale = useSharedValue(1);
  const hasHitTopScale = useSharedValue(0);

  /**
   * Shared values for touch tracking
   */
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const oldFocalX = useSharedValue(0);
  const oldFocalY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const index = useSharedValue(0);

  /**
   * Shared values for movement
   */
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  /**
   * Shared values for touch tracking
   */
  const focalOffsetX = useSharedValue(0);
  const focalOffsetY = useSharedValue(0);
  const adjustedFocalX = useSharedValue(0);
  const adjustedFocalY = useSharedValue(0);
  const tapX = useSharedValue(0);
  const tapY = useSharedValue(0);

  /**
   * Shared values for gesture tracking
   */
  const numberOfPinchFingers = useSharedValue(0);
  const isSwiping = useSharedValue(0);
  const isPinch = useSharedValue(false);
  const hasPinched = useSharedValue(0);

  /**
   * Reset gesture values for use on touch release
   */
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

  /**
   * Reset movement values for use on selected photo change
   */
  const resetMovementValues = () => {
    'worklet';
    translateX.value = 0;
    translateY.value = 0;
    scale.value = 1;
    offsetScale.value = 1;
  };

  /**
   * We use simultaneousHandlers to allow pan and pinch gesture handlers
   * depending on the gesture. The touch is fully handled by the pinch
   * gesture handler once it has began so all interactions by the pan
   * handler are blocked if isPinch.value is true
   */
  const onPan = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>(
    {
      onActive: (evt) => {
        if (evt.numberOfPointers === 1 && !isPinch.value) {
          /**
           * If Android where a second finger cannot be added back and
           * removing one finger returns to Pan Handler then adjust origin
           * on finger remove and set swiping false
           */
          if (isAndroid && hasPinched.value === HasPinched.TRUE) {
            hasPinched.value = HasPinched.FALSE;
            isSwiping.value = IsSwiping.FALSE;
            offsetX.value = translateX.value + evt.translationX;
            offsetY.value = translateY.value - evt.translationY;
          }

          /**
           * isSwiping is used to prevent Y movement if a clear swipe to next
           * or previous is begun when at the edge of a photo. The value is
           * either 0, 1, or 2, via the IsSwiping enum designating undetermined,
           * true, or false and is reset on releasing the touch
           */
          if (isSwiping.value === IsSwiping.UNDETERMINED) {
            const maxXYRatio = isAndroid ? 1 : 0.25;
            if (
              Math.abs(evt.translationX / evt.translationY) > maxXYRatio &&
              (Math.abs(-halfScreenWidth * (scale.value - 1) - offsetX.value) < 3 ||
                Math.abs(halfScreenWidth * (scale.value - 1) - offsetX.value) < 3)
            ) {
              isSwiping.value = IsSwiping.TRUE;
            }
            if (Math.abs(evt.translationY) > 25) {
              isSwiping.value = IsSwiping.FALSE;
            }
          }

          /**
           * localEvtScale is used for swipe away
           */
          const localEvtScale = scale.value / offsetScale.value;

          /**
           * If not swiping translate the image in X and Y to the event
           * translation plus offset. If swiping only translate X, if
           * swiping down when at top of screen or centered balance scale
           * using offset to a degree (this needs improvement the calculation
           * is incorrect but likely needs origin use to be 100%)
           */
          translateX.value =
            scale.value !== offsetScale.value
              ? offsetX.value * localEvtScale - evt.translationX
              : offsetX.value - evt.translationX;
          translateY.value =
            isSwiping.value !== IsSwiping.TRUE
              ? scale.value !== offsetScale.value
                ? offsetY.value * localEvtScale + evt.translationY
                : offsetY.value + evt.translationY
              : translateY.value;

          /**
           * If swiping down start scaling down the image for swipe
           * away effect
           */
          scale.value =
            currentImageHeight * offsetScale.value < screenHeight && translateY.value > 0
              ? offsetScale.value * (1 - (1 / 3) * (translateY.value / screenHeight))
              : currentImageHeight * offsetScale.value > screenHeight &&
                translateY.value > (currentImageHeight / 2) * offsetScale.value - halfScreenHeight
              ? offsetScale.value *
                (1 -
                  (1 / 3) *
                    ((translateY.value -
                      ((currentImageHeight / 2) * offsetScale.value - halfScreenHeight)) /
                      screenHeight))
              : scale.value;

          overlayOpacity.value = localEvtScale;
        }
      },
      onFinish: (evt) => {
        if (!isPinch.value && evt.numberOfPointers < 2) {
          /**
           * To determine if the fling should page to the next image we
           * calculate a final position based on the current position and
           * event velocity
           */
          const finalXPosition = evt.translationX - evt.velocityX * 0.3;
          const finalYPosition = evt.translationY + evt.velocityY * 0.1;

          /**
           * If there is a next photo, the image is lined up to the right
           * edge, the swipe is to the left, and the final position is more
           * than half the screen width, move to the next image
           */
          if (
            index.value < photoLength - 1 &&
            Math.abs(halfScreenWidth * (scale.value - 1) + offsetX.value) < 3 &&
            translateX.value < 0 &&
            finalXPosition < -halfScreenWidth &&
            isSwiping.value === IsSwiping.TRUE
          ) {
            cancelAnimation(translationX);
            translationX.value = withTiming(
              -(screenWidth + MARGIN) * (index.value + 1),
              {
                duration: 200,
                easing: Easing.out(Easing.ease),
              },
              () => {
                resetMovementValues();
                index.value = index.value + 1;
                runOnJS(setSelectedIndex)(index.value);
              },
            );

            /**
             * If there is a previous photo, the image is lined up to the left
             * edge, the swipe is to the right, and the final position is more
             * than half the screen width, move to the previous image
             */
          } else if (
            index.value > 0 &&
            Math.abs(-halfScreenWidth * (scale.value - 1) + offsetX.value) < 3 &&
            translateX.value > 0 &&
            finalXPosition > halfScreenWidth &&
            isSwiping.value === IsSwiping.TRUE
          ) {
            cancelAnimation(translationX);
            translationX.value = withTiming(
              -(screenWidth + MARGIN) * (index.value - 1),
              {
                duration: 200,
                easing: Easing.out(Easing.ease),
              },
              () => {
                resetMovementValues();
                index.value = index.value - 1;
                runOnJS(setSelectedIndex)(index.value);
              },
            );
          }

          /**
           * When the pan is finished if the scale is less than 1 return the
           * photo to center, if the photo is inside the edges of the screen
           * return the photo to line up with the edges, otherwise use decay
           * with a clamping at the edges to give the effect the image is
           * sliding along using velocity and friction
           */
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
                  velocity: -evt.velocityX,
                });

          /**
           * When the pan is finished if the height is less than the screen
           * height return the photo to center, if the photo is inside the
           * edges of the screen return the photo to line up with the edges,
           * otherwise use decay with a clamping at the edges to give the effect
           * the image is sliding along using velocity and friction
           */
          translateY.value =
            currentImageHeight * scale.value < screenHeight
              ? withTiming(0)
              : translateY.value > (currentImageHeight / 2) * scale.value - halfScreenHeight
              ? withTiming((currentImageHeight / 2) * scale.value - halfScreenHeight)
              : translateY.value < (-currentImageHeight / 2) * scale.value + halfScreenHeight
              ? withTiming((-currentImageHeight / 2) * scale.value + halfScreenHeight)
              : withDecay({
                  clamp: [
                    (-currentImageHeight / 2) * scale.value + halfScreenHeight,
                    (currentImageHeight / 2) * scale.value - halfScreenHeight,
                  ],
                  deceleration: 0.99,
                  velocity: evt.velocityY,
                });

          resetTouchValues();

          /**
           * If the scale has been reduced below one, i.e. zoomed out, translate
           * the zoom back to one
           */
          scale.value =
            scale.value !== offsetScale.value ? withTiming(offsetScale.value) : offsetScale.value;

          /**
           * If the photo is centered or at the top of the screen if scaled larger
           * than the screen, and not paging left or right, and the final Y position
           * is greater than half the screen using swipe velocity and position, close
           * the overlay
           */
          if (
            finalYPosition > halfScreenHeight &&
            offsetY.value + 8 >= (currentImageHeight / 2) * scale.value - halfScreenHeight &&
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
                runOnJS(setOverlay)('none');
              },
            );
            scale.value = withTiming(0.6, {
              duration: 200,
              easing: Easing.out(Easing.ease),
            });
            translateY.value =
              evt.velocityY > 1000
                ? withDecay({
                    velocity: evt.velocityY,
                  })
                : withTiming(halfScreenHeight + (currentImageHeight / 2) * scale.value, {
                    duration: 200,
                    easing: Easing.out(Easing.ease),
                  });
            translateX.value = withDecay({
              velocity: -evt.velocityX,
            });
          }
        }
      },

      onStart: () => {
        if (!isPinch.value) {
          /**
           * Cancel any previous motion animation on translations when a touch
           * begins to interrupt the animation and take over the position handling
           */
          cancelAnimation(translateX);
          cancelAnimation(translateY);
          cancelAnimation(scale);
          offsetX.value = translateX.value;
          offsetY.value = translateY.value;
        }

        /**
         * Reset hasPinched for Android single finger offset
         */
        hasPinched.value = HasPinched.FALSE;
      },
    },
    [currentImageHeight, photoLength],
  );

  /**
   * On pinch is run when two or more fingers touch the screen, it then takes over
   * all touch handling even if the number of fingers is reduced to one until the
   * touch is complete
   */
  const onPinch = useAnimatedGestureHandler<PinchGestureHandlerGestureEvent>(
    {
      onActive: (evt) => {
        /**
         * Android starts with a zero event with 1 touch instead of two
         * we therefore must wait to capture starting info until the double
         * touch begins
         */
        if (!isPinch.value && isAndroid) {
          /**
           * Set hasPinched to true so when removing one finger the pan active
           * state adjusts the offset
           */
          hasPinched.value = HasPinched.TRUE;

          /**
           * Cancel any previous motion animation on translations when a touch
           * begins to interrupt the animation and take over the position handling
           */
          cancelAnimation(translateX);
          cancelAnimation(translateY);
          cancelAnimation(scale);

          /**
           * Reset isSwiping as now the pan gesture handler is no longer running
           */
          isSwiping.value = IsSwiping.UNDETERMINED;

          /**
           * Set initial values for pinch gesture interaction handler
           */
          numberOfPinchFingers.value = evt.numberOfPointers;
          offsetX.value = translateX.value;
          offsetY.value = translateY.value;
          adjustedFocalX.value = evt.focalX - (halfScreenWidth - offsetX.value);
          adjustedFocalY.value = evt.focalY - (halfScreenHeight + offsetY.value);
          originX.value = adjustedFocalX.value;
          originY.value = adjustedFocalY.value;
          offsetScale.value = scale.value;
        }

        /**
         * Set pinch to true to stop all pan gesture interactions, we do this
         * again here for Android outside the check that creates type
         */
        isPinch.value = true;

        /**
         * The scale is clamped to a minimum of 1 and maximum of 8 for aesthetics.
         * We use the clamped value to determine a local event scale so the focal
         * point does not become out of sync with the actual photo scaling, e.g.
         * evt.scale is 20 but scale is 8, using evt.scale for offset will put the
         * photo and calculations out of sync
         */
        scale.value = clamp(offsetScale.value * evt.scale, 1, 8);
        const localEvtScale = scale.value / offsetScale.value;

        /**
         * When we hit the top or bottom of the scale clamping we run a haptic
         * trigger, we track if it has been run to not spam the trigger
         */
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

        /**
         * We calculate the adjusted focal point on the photo using the events
         * focal position on the screen, screen size, and current photo offset
         */
        adjustedFocalX.value = evt.focalX - (halfScreenWidth - offsetX.value);
        adjustedFocalY.value = evt.focalY - (halfScreenHeight + offsetY.value);

        /**
         * If the number of fingers on the screen changes, the position of the
         * focal point will change and this needs to be accounted for, e.g. if
         * two fingers are on the screen the focal is between them, but if one is
         * then removed the focal is now at the remaining fingers touch position.
         * If this happens without accounting for the change the image will jump
         * around, we keep track of the previous two finger focal to adjust for this
         * change in a reduction from two fingers to one, then if another finger
         * is added again we adjust the origin to account for the difference between
         * the original two finger touch and the new two finger touch position.
         */
        if (numberOfPinchFingers.value !== evt.numberOfPointers) {
          numberOfPinchFingers.value = evt.numberOfPointers;
          if (evt.numberOfPointers === 1) {
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

        /**
         * If pinch handler has been activated via two fingers then the fingers
         * reduced to one we keep track of the old focal using the focal offset
         * from when the number of fingers was two. We then translate the photo
         * taking into account the offset, focal, focal offset, origin, and scale.
         */
        if (numberOfPinchFingers.value === 1) {
          oldFocalX.value = adjustedFocalX.value + focalOffsetX.value;
          oldFocalY.value = adjustedFocalY.value + focalOffsetY.value;
          translateX.value = offsetX.value - oldFocalX.value + localEvtScale * originX.value;
          translateY.value = offsetY.value + oldFocalY.value - localEvtScale * originY.value;

          /**
           * If the number of fingers in the gesture is greater than one the
           * adjusted focal point is saved as the old focal and the photo is
           * translated taking into account the offset, focal, origin, and scale.
           */
        } else if (numberOfPinchFingers.value > 1) {
          oldFocalX.value = adjustedFocalX.value;
          oldFocalY.value = adjustedFocalY.value;
          translateX.value = offsetX.value - adjustedFocalX.value + localEvtScale * originX.value;
          translateY.value = offsetY.value + adjustedFocalY.value - localEvtScale * originY.value;
        }
      },
      onFinish: () => {
        if (isPinch.value) {
          /**
           * When the pinch is finished if the scale is less than 1 return the
           * photo to center, if the photo is inside the edges of the screen
           * return the photo to line up with the edges, otherwise leave the
           * photo in its current position
           */
          translateX.value =
            scale.value < 1
              ? withTiming(0)
              : translateX.value > halfScreenWidth * (scale.value - 1)
              ? withTiming(halfScreenWidth * (scale.value - 1))
              : translateX.value < -halfScreenWidth * (scale.value - 1)
              ? withTiming(-halfScreenWidth * (scale.value - 1))
              : translateX.value;

          /**
           * When the pinch is finished if the height is less than the screen
           * height return the photo to center, if the photo is inside the
           * edges of the screen return the photo to line up with the edges,
           * otherwise leave the photo in its current position
           */
          translateY.value =
            currentImageHeight * scale.value < screenHeight
              ? withTiming(0)
              : translateY.value > (currentImageHeight / 2) * scale.value - screenHeight / 2
              ? withTiming((currentImageHeight / 2) * scale.value - screenHeight / 2)
              : translateY.value < (-currentImageHeight / 2) * scale.value + screenHeight / 2
              ? withTiming((-currentImageHeight / 2) * scale.value + screenHeight / 2)
              : translateY.value;

          /**
           * If the scale has been reduced below one, i.e. zoomed out, translate
           * the zoom back to one
           */
          offsetScale.value = scale.value < 1 ? 1 : scale.value;
          scale.value = scale.value < 1 ? withTiming(1) : scale.value;
          resetTouchValues();
        }
      },
      onStart: (evt) => {
        /**
         * Android starts with a zero event with 1 touch instead of two
         * we therefore must wait to capture starting info until the double
         * touch begins
         */
        if (!isAndroid) {
          /**
           * Cancel any previous motion animation on translations when a touch
           * begins to interrupt the animation and take over the position handling
           */
          cancelAnimation(translateX);
          cancelAnimation(translateY);
          cancelAnimation(scale);

          /**
           * Set pinch to true to stop all pan gesture interactions
           */
          isPinch.value = true;

          /**
           * Reset isSwiping as now the pan gesture handler is no longer running
           */
          isSwiping.value = IsSwiping.UNDETERMINED;

          /**
           * Set initial values for pinch gesture interaction handler
           */
          numberOfPinchFingers.value = evt.numberOfPointers;
          offsetX.value = translateX.value;
          offsetY.value = translateY.value;
          adjustedFocalX.value = evt.focalX - (halfScreenWidth - offsetX.value);
          adjustedFocalY.value = evt.focalY - (halfScreenHeight + offsetY.value);
          originX.value = adjustedFocalX.value;
          originY.value = adjustedFocalY.value;
          offsetScale.value = scale.value;
        }

        /**
         * Reset hasPinched for Android single finger offset
         */
        hasPinched.value = HasPinched.FALSE;
      },
    },
    [currentImageHeight],
  );

  /**
   * Single tap handler for header hiding and showing
   */
  const onSingleTap = useAnimatedGestureHandler<TapGestureHandlerGestureEvent>({
    onActive: () => {
      cancelAnimation(headerFooterVisible);
      headerFooterVisible.value = headerFooterVisible.value > 0 ? withTiming(0) : withTiming(1);
    },
  });

  /**
   * Double tap handler to zoom back out and hide header and footer
   */
  const onDoubleTap = useAnimatedGestureHandler<TapGestureHandlerGestureEvent>({
    onActive: (evt) => {
      if (Math.abs(tapX.value - evt.absoluteX) < 64 && Math.abs(tapY.value - evt.absoluteY) < 64) {
        if (offsetScale.value === 1 && offsetX.value === 0 && offsetY.value === 0) {
          offsetScale.value = 2;
          scale.value = withTiming(2, {
            duration: 200,
            easing: Easing.out(Easing.ease),
          });
          translateX.value = withTiming(evt.absoluteX - halfScreenWidth, {
            duration: 200,
            easing: Easing.out(Easing.ease),
          });
          if (currentImageHeight * 2 > screenHeight) {
            const translateYTopBottom =
              evt.absoluteY > halfScreenHeight
                ? -(currentImageHeight * 2 - screenHeight) / 2
                : (currentImageHeight * 2 - screenHeight) / 2;
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
    },
    onStart: (evt) => {
      tapX.value = evt.absoluteX;
      tapY.value = evt.absoluteY;
    },
  });

  return {
    onDoubleTap,
    onPan,
    onPinch,
    onSingleTap,
  };
};

/**
 * Clamping worklet to clamp the scaling
 */
export const clamp = (value: number, lowerBound: number, upperBound: number) => {
  'worklet';
  return Math.min(Math.max(lowerBound, value), upperBound);
};
