import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  ImageStyle,
  Keyboard,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  PinchGestureHandler,
  PinchGestureHandlerGestureEvent,
  TapGestureHandler,
  TapGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  // @ts-expect-error TODO: Remove on next Reanimated update with new types
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDecay,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedGalleryImage } from './components/AnimatedImage';
import { ImageGalleryFooter } from './components/ImageGalleryFooter';
import { ImageGalleryHeader } from './components/ImageGalleryHeader';

import { useImageGalleryContext, useOverlayContext } from '../../contexts';
import { vh, vw } from '../../utils/utils';

import type SeamlessImmutable from 'seamless-immutable';
import type { Attachment, UserResponse } from 'stream-chat';
import type { DefaultUserType } from 'src/types/types';

const screenHeight = vh(100);
const halfScreenHeight = vh(50);
const screenWidth = vw(100);
const halfScreenWidth = vw(50);
const MARGIN = 32;

export enum IsSwiping {
  UNDETERMINED = 0,
  TRUE,
  FALSE,
}

/**
 * Clamping worklet to clamp the scaling
 */
export const clamp = (
  value: number,
  lowerBound: number,
  upperBound: number,
) => {
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
  created_at: string | SeamlessImmutable.ImmutableDate | undefined;
  id: string;
  uri: string;
  user:
    | UserResponse<DefaultUserType>
    | SeamlessImmutable.ImmutableObject<DefaultUserType>
    | null
    | undefined;
  user_id: string | undefined;
};

type Props = {
  overlayOpacity: Animated.SharedValue<number>;
  visible: boolean;
};

export const ImageGallery: React.FC<Props> = (props) => {
  const { overlayOpacity, visible } = props;
  const { setBlurType, setOverlay } = useOverlayContext();
  const { images } = useImageGalleryContext();

  /**
   * Fade animation for screen, it is always rendered with pointerEvents
   * set to none for fast opening
   */
  const screenOpacity = useSharedValue(0);
  const fadeScreen = (show: boolean) => {
    'worklet';
    screenOpacity.value = withTiming(show ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
  };

  /**
   * Run the fade animation on visible change
   */
  useEffect(() => {
    Keyboard.dismiss();
    fadeScreen(visible);
  }, [visible]);

  /**
   * Image height from URL or default to full screen height
   */
  const [currentImageHeight, setCurrentImageHeight] = useState<number>(vh(100));

  /**
   * JS and UI index values, the JS follows the UI but is needed
   * for rendering the virtualized image list
   */
  const [selectedIndex, setSelectedIndex] = useState(0);
  const index = useSharedValue(0);

  /**
   * Header visible value for animating in out
   */
  const headerFooterVisible = useSharedValue(1);

  /**
   * Gesture handler refs
   */
  const doubleTapRef = useRef<TapGestureHandler>(null);
  const panRef = useRef<PanGestureHandler>(null);
  const pinchRef = useRef<PinchGestureHandler>(null);
  const singleTapRef = useRef<TapGestureHandler>(null);

  /**
   * Shared values for movement
   */
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const offsetScale = useSharedValue(1);
  const scale = useSharedValue(1);
  const translationX = useSharedValue(0);

  /**
   * Shared values for touch tracking
   */
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const oldFocalX = useSharedValue(0);
  const oldFocalY = useSharedValue(0);
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
   * Reset all key values for visible
   */
  const resetVisibleValues = () => {
    'worklet';
    resetTouchValues();
    resetMovementValues();
    headerFooterVisible.value = 1;
    offsetX.value = 0;
    offsetY.value = 0;
    adjustedFocalX.value = 0;
    adjustedFocalY.value = 0;
    tapX.value = 0;
    tapY.value = 0;
  };

  useEffect(() => {
    if (!visible) {
      resetVisibleValues();
    }
  }, [visible]);

  /**
   * Photos array created from all currently available
   * photo attachments
   */
  const photos = images.reduce((acc: Array<Photo>, cur) => {
    const attachmentImages = (cur.attachments as Attachment[])?.filter(
      (attachment) =>
        attachment.type === 'image' &&
        !attachment.title_link &&
        !attachment.og_scrape_url &&
        (attachment.image_url || attachment.thumb_url),
    );

    const attachmentPhotos = attachmentImages.map((attachmentImage) => ({
      created_at: cur.created_at,
      id: `photoId-${cur.id}-${
        attachmentImage.image_url || attachmentImage.thumb_url
      }`,
      uri: attachmentImage.image_url || (attachmentImage.thumb_url as string),
      user: cur.user,
      user_id: cur.user_id,
    }));

    return [...acc, ...attachmentPhotos];
  }, []);

  /**
   * Photos length needs to be kept as a const here so if the length
   * changes it causes the pan gesture handler function to refresh. This
   * does not work if the calculation for the length of the array is left
   * inside the gesture handler as it will have an array as a dependency
   */
  const photoLength = photos.length;

  /**
   * Image heights are not provided and therefore need to be calculated.
   * We start by allowing the image to be the full height then reduce it
   * to the proper scaled height based on the width being restricted to the
   * screen width when the dimensions are received.
   */
  const uriForCurrentImage = photos[selectedIndex]?.uri;
  useEffect(() => {
    setCurrentImageHeight(vh(100));
    if (photos[index.value]?.uri) {
      Image.getSize(photos[index.value].uri, (width, height) => {
        const imageHeight = Math.floor(height * (screenWidth / width));
        setCurrentImageHeight(
          imageHeight > screenHeight ? screenHeight : imageHeight,
        );
      });
    }
  }, [uriForCurrentImage]);

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
           * isSwiping is used to prevent Y movement if a clear swipe to next
           * or previous is begun when at the edge of a photo. The value is
           * either 0, 1, or 2, via the IsSwiping enum designating undetermined,
           * true, or false and is reset on releasing the touch
           */
          if (isSwiping.value === IsSwiping.UNDETERMINED) {
            if (
              Math.abs(evt.translationX / evt.translationY) > 0.25 &&
              (Math.abs(-halfScreenWidth * (scale.value - 1) - offsetX.value) <
                3 ||
                Math.abs(halfScreenWidth * (scale.value - 1) - offsetX.value) <
                  3)
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
              ? offsetX.value * localEvtScale + evt.translationX
              : offsetX.value + evt.translationX;
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
            currentImageHeight * offsetScale.value < screenHeight &&
            translateY.value > 0
              ? offsetScale.value *
                (1 - (1 / 3) * (translateY.value / screenHeight))
              : currentImageHeight * offsetScale.value > screenHeight &&
                translateY.value >
                  (currentImageHeight / 2) * offsetScale.value -
                    halfScreenHeight
              ? offsetScale.value *
                (1 -
                  (1 / 3) *
                    ((translateY.value -
                      ((currentImageHeight / 2) * offsetScale.value -
                        halfScreenHeight)) /
                      screenHeight))
              : scale.value;

          overlayOpacity.value = localEvtScale;
        }
      },
      onFinish: (evt) => {
        if (!isPinch.value) {
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
            Math.abs(-halfScreenWidth * (scale.value - 1) + offsetX.value) <
              3 &&
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
              : translateY.value >
                (currentImageHeight / 2) * scale.value - halfScreenHeight
              ? withTiming(
                  (currentImageHeight / 2) * scale.value - halfScreenHeight,
                )
              : translateY.value <
                (-currentImageHeight / 2) * scale.value + halfScreenHeight
              ? withTiming(
                  (-currentImageHeight / 2) * scale.value + halfScreenHeight,
                )
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
            scale.value !== offsetScale.value
              ? withTiming(offsetScale.value)
              : offsetScale.value;

          /**
           * If the photo is centered or at the top of the screen if scaled larger
           * than the screen, and not paging left or right, and the final Y position
           * is greater than half the screen using swipe velocity and position, close
           * the overlay
           */
          if (
            finalYPosition > halfScreenHeight &&
            offsetY.value + 8 >=
              (currentImageHeight / 2) * scale.value - halfScreenHeight &&
            isSwiping.value !== IsSwiping.TRUE &&
            !(
              Math.abs(halfScreenWidth * (scale.value - 1) + offsetX.value) <
                3 &&
              translateX.value < 0 &&
              finalXPosition < -halfScreenWidth
            ) &&
            !(
              Math.abs(-halfScreenWidth * (scale.value - 1) + offsetX.value) <
                3 &&
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
                screenOpacity.value = 0;
                runOnJS(setOverlay)('none');
                runOnJS(setBlurType)(undefined);
              },
            );
            scale.value = withTiming(0.6, {
              duration: 200,
              easing: Easing.out(Easing.ease),
            });
            translateY.value = withDecay({
              velocity: evt.velocityY,
            });
            translateX.value = withDecay({
              velocity: evt.velocityX,
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
         * The scale is clamped to a minimum of 1 and maximum of 8 for aesthetics.
         * We use the clamped value to determine a local event scale so the focal
         * point does not become out of sync with the actual photo scaling, e.g.
         * evt.scale is 20 but scale is 8, using evt.scale for offset will put the
         * photo and calculations out of sync
         */
        scale.value = clamp(offsetScale.value * evt.scale, 1, 8);
        const localEvtScale = scale.value / offsetScale.value;

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
              (oldFocalX.value / localEvtScale -
                adjustedFocalX.value / localEvtScale);
            originY.value =
              originY.value -
              (oldFocalY.value / localEvtScale -
                adjustedFocalY.value / localEvtScale);
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
          translateX.value =
            offsetX.value - oldFocalX.value + localEvtScale * originX.value;
          translateY.value =
            offsetY.value + oldFocalY.value - localEvtScale * originY.value;

          /**
           * If the number of fingers in the gesture is greater than one the
           * adjusted focal point is saved as the old focal and the photo is
           * translated taking into account the offset, focal, origin, and scale.
           */
        } else if (numberOfPinchFingers.value > 1) {
          oldFocalX.value = adjustedFocalX.value;
          oldFocalY.value = adjustedFocalY.value;
          translateX.value =
            offsetX.value -
            adjustedFocalX.value +
            localEvtScale * originX.value;
          translateY.value =
            offsetY.value +
            adjustedFocalY.value -
            localEvtScale * originY.value;
        }
      },
      onFinish: () => {
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
            : translateY.value >
              (currentImageHeight / 2) * scale.value - screenHeight / 2
            ? withTiming(
                (currentImageHeight / 2) * scale.value - screenHeight / 2,
              )
            : translateY.value <
              (-currentImageHeight / 2) * scale.value + screenHeight / 2
            ? withTiming(
                (-currentImageHeight / 2) * scale.value + screenHeight / 2,
              )
            : translateY.value;

        /**
         * If the scale has been reduced below one, i.e. zoomed out, translate
         * the zoom back to one
         */
        offsetScale.value = scale.value < 1 ? 1 : scale.value;
        scale.value = scale.value < 1 ? withTiming(1) : scale.value;

        resetTouchValues();
      },
      onStart: (evt) => {
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
      headerFooterVisible.value =
        headerFooterVisible.value > 0 ? withTiming(0) : withTiming(1);
    },
  });

  /**
   * Double tap handler to zoom back out and hide header and footer
   */
  const onDoubleTap = useAnimatedGestureHandler<TapGestureHandlerGestureEvent>({
    onActive: (evt) => {
      if (
        Math.abs(tapX.value - evt.absoluteX) < 32 &&
        Math.abs(tapY.value - evt.absoluteY) < 32
      ) {
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
    },
    onStart: (evt) => {
      tapX.value = evt.absoluteX;
      tapY.value = evt.absoluteY;
    },
  });

  /**
   * If the header is visible we scale down the opacity of it as the
   * image is swiped downward
   */
  const headerFooterOpacity = useDerivedValue(
    () =>
      currentImageHeight * scale.value < screenHeight && translateY.value > 0
        ? 1 - translateY.value / screenHeight
        : currentImageHeight * scale.value > screenHeight &&
          translateY.value >
            (currentImageHeight / 2) * scale.value - halfScreenHeight
        ? 1 -
          (translateY.value -
            ((currentImageHeight / 2) * scale.value - halfScreenHeight)) /
            screenHeight
        : 1,
    [currentImageHeight],
  );

  /**
   * This transition and scaleX reverse lets use scroll left
   */
  const pagerStyle = useAnimatedStyle<ImageStyle>(
    () => ({
      transform: [
        { scaleX: -1 },
        {
          translateX: translationX.value,
        },
      ],
    }),
    [visible],
  );

  /**
   * Simple background color animation on Y movement
   */
  const containerBackground = useAnimatedStyle<ViewStyle>(
    () => ({
      backgroundColor: '#F2F2F2',
      opacity: headerFooterOpacity.value,
    }),
    [headerFooterOpacity],
  );

  /**
   * Fade in style as component is always rendered
   */
  const fadeInStyle = useAnimatedStyle<ViewStyle>(
    () => ({
      opacity: screenOpacity.value,
    }),
    [],
  );

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[StyleSheet.absoluteFillObject, fadeInStyle]}
    >
      <Animated.View
        style={[StyleSheet.absoluteFillObject, containerBackground]}
      />
      <TapGestureHandler
        minPointers={1}
        numberOfTaps={1}
        onGestureEvent={onSingleTap}
        ref={singleTapRef}
        waitFor={[panRef, pinchRef, doubleTapRef]}
      >
        <Animated.View style={StyleSheet.absoluteFillObject}>
          <TapGestureHandler
            maxDeltaX={8}
            maxDeltaY={8}
            maxDist={8}
            minPointers={1}
            numberOfTaps={2}
            onGestureEvent={onDoubleTap}
            ref={doubleTapRef}
            simultaneousHandlers={[panRef, pinchRef, singleTapRef]}
          >
            <Animated.View style={StyleSheet.absoluteFillObject}>
              <PinchGestureHandler
                onGestureEvent={onPinch}
                ref={pinchRef}
                simultaneousHandlers={[doubleTapRef, panRef, singleTapRef]}
              >
                <Animated.View style={StyleSheet.absoluteFill}>
                  <PanGestureHandler
                    maxPointers={1}
                    minDist={10}
                    onGestureEvent={onPan}
                    ref={panRef}
                    simultaneousHandlers={[
                      doubleTapRef,
                      pinchRef,
                      singleTapRef,
                    ]}
                  >
                    <Animated.View
                      style={[
                        StyleSheet.absoluteFill,
                        styles.animatedContainer,
                        pagerStyle,
                        {
                          transform: [
                            { scaleX: -1 }, // Also only here for opening, wrong direction when not included
                            {
                              translateX: translationX.value, // Only here for opening, wrong index when this is not included
                            },
                          ],
                        },
                      ]}
                    >
                      {photos.map((photo, i) => (
                        <AnimatedGalleryImage
                          key={`${photo.uri}-${i}`}
                          offsetScale={offsetScale}
                          photo={photo}
                          previous={selectedIndex > i}
                          scale={scale}
                          selected={selectedIndex === i}
                          shouldRender={Math.abs(selectedIndex - i) < 4}
                          style={{
                            height: screenHeight,
                            marginRight: MARGIN,
                            width: screenWidth,
                          }}
                          translateX={translateX}
                          translateY={translateY}
                        />
                      ))}
                    </Animated.View>
                  </PanGestureHandler>
                </Animated.View>
              </PinchGestureHandler>
            </Animated.View>
          </TapGestureHandler>
        </Animated.View>
      </TapGestureHandler>
      <ImageGalleryHeader
        opacity={headerFooterOpacity}
        photo={photos[selectedIndex]}
        visible={headerFooterVisible}
      />
      <ImageGalleryFooter
        opacity={headerFooterOpacity}
        photo={photos[selectedIndex]}
        photoLength={photoLength}
        selectedIndex={selectedIndex}
        visible={headerFooterVisible}
      />
    </Animated.View>
  );
};
