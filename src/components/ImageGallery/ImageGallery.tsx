import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  ImageStyle,
  Keyboard,
  Platform,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
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
  interpolate,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDecay,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedGalleryImage } from './components/AnimatedGalleryImage';
import {
  ImageGalleryFooter,
  ImageGalleryFooterCustomComponentProps,
} from './components/ImageGalleryFooter';
import {
  ImageGalleryHeader,
  ImageGalleryHeaderCustomComponentProps,
} from './components/ImageGalleryHeader';
import { ImageGalleryOverlay } from './components/ImageGalleryOverlay';
import {
  ImageGalleryGridImageComponents,
  ImageGrid,
} from './components/ImageGrid';
import {
  ImageGalleryGridHandleCustomComponentProps,
  ImageGridHandle,
} from './components/ImageGridHandle';

import { useImageGalleryContext } from '../../contexts/imageGalleryContext/ImageGalleryContext';
import { useOverlayContext } from '../../contexts/overlayContext/OverlayContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { triggerHaptic } from '../../native';
import { vh, vw } from '../../utils/utils';

import type { UserResponse } from 'stream-chat';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

const isAndroid = Platform.OS === 'android';

const screenHeight = vh(100);
const halfScreenHeight = vh(50);
const quarterScreenHeight = vh(25);
const screenWidth = vw(100);
const halfScreenWidth = vw(50);
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

export type ImageGalleryCustomComponents<
  Us extends UnknownType = DefaultUserType
> = {
  /**
   * Override props for following UI components, which are part of [image gallery](https://github.com/GetStream/stream-chat-react-native/blob/vishal/v2-designs-docs/screenshots/docs/3.png).
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
    footer?: ImageGalleryFooterCustomComponentProps<Us>;
    grid?: ImageGalleryGridImageComponents<Us>;
    gridHandle?: ImageGalleryGridHandleCustomComponentProps;
    header?: ImageGalleryHeaderCustomComponentProps<Us>;
  };
};

type Props<
  Us extends UnknownType = DefaultUserType
> = ImageGalleryCustomComponents<Us> & {
  overlayOpacity: Animated.SharedValue<number>;
  visible: boolean;
  imageGalleryGridHandleHeight?: number;
  /**
   * This should be
   */
  imageGalleryGridSnapPoints?: [string | number, string | number];
  numberOfImageGalleryGridColumns?: number;
};

export const ImageGallery = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: Props<Us>,
) => {
  const {
    imageGalleryCustomComponents,
    imageGalleryGridHandleHeight,
    imageGalleryGridSnapPoints,
    numberOfImageGalleryGridColumns,
    overlayOpacity,
    visible,
  } = props;
  const {
    theme: {
      colors: { white_snow },
      imageGallery: { backgroundColor },
    },
  } = useTheme();
  const { overlay, setBlurType, setOverlay } = useOverlayContext();
  const { image, images, setImage } = useImageGalleryContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();

  /**
   * BottomSheet ref
   */
  const bottomSheetRef = useRef<BottomSheet>(null);

  /**
   * BottomSheet state
   */
  const [currentBottomSheetIndex, setCurrentBottomSheetIndex] = useState(0);
  const animatedBottomSheetIndex = useSharedValue(0);

  /**
   * Fade animation for screen, it is always rendered with pointerEvents
   * set to none for fast opening
   */
  const showScreen = useSharedValue(0);
  const fadeScreen = (show: boolean) => {
    'worklet';
    showScreen.value = withTiming(show ? 1 : 0, {
      duration: 250,
      easing: Easing.out(Easing.ease),
    });
  };

  /**
   * Run the fade animation on visible change
   */
  useEffect(() => {
    if (visible) {
      Keyboard.dismiss();
    }
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
   * Values to track scale for haptic feedback firing
   */
  const hasHitBottomScale = useSharedValue(1);
  const hasHitTopScale = useSharedValue(0);

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
  const photos = images.reduce((acc: Photo<Us>[], cur) => {
    const attachmentImages =
      cur.attachments?.filter(
        (attachment) =>
          attachment.type === 'image' &&
          !attachment.title_link &&
          !attachment.og_scrape_url &&
          (attachment.image_url || attachment.thumb_url),
      ) || [];

    const attachmentPhotos = attachmentImages.map((attachmentImage) => ({
      created_at: cur.created_at,
      id: `photoId-${cur.id}-${
        attachmentImage.image_url || attachmentImage.thumb_url
      }`,
      messageId: cur.id,
      uri: attachmentImage.image_url || attachmentImage.thumb_url || '',
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
   * Set selected photo when changed via pressing in the message list
   */
  useEffect(() => {
    const newIndex = photos.findIndex(
      (photo) =>
        photo.messageId === image?.messageId && photo.uri === image?.url,
    );

    if (newIndex > -1) {
      index.value = newIndex;
      translationX.value = -(screenWidth + MARGIN) * newIndex;
      setSelectedIndex(newIndex);
    }
  }, [image, photoLength]);

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
           * If Android where a second finger cannot be added back and
           * removing one finger returns to Pan Handler then adjust origin
           * on finger remove and set swiping false
           */
          if (isAndroid && hasPinched.value === HasPinched.TRUE) {
            hasPinched.value = HasPinched.FALSE;
            isSwiping.value === IsSwiping.FALSE;
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
            translateY.value !== 0 &&
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
                showScreen.value = 0;
                runOnJS(setOverlay)('none');
                runOnJS(setBlurType)(undefined);
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
                : withTiming(
                    halfScreenHeight + (currentImageHeight / 2) * scale.value,
                    {
                      duration: 200,
                      easing: Easing.out(Easing.ease),
                    },
                  );
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
          adjustedFocalY.value =
            evt.focalY - (halfScreenHeight + offsetY.value);
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
          adjustedFocalY.value =
            evt.focalY - (halfScreenHeight + offsetY.value);
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
        Math.abs(tapX.value - evt.absoluteX) < 64 &&
        Math.abs(tapY.value - evt.absoluteY) < 64
      ) {
        if (
          offsetScale.value === 1 &&
          offsetX.value === 0 &&
          offsetY.value === 0
        ) {
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

  /**
   * If the header is visible we scale down the opacity of it as the
   * image is swiped downward
   */
  const headerFooterOpacity = useDerivedValue(
    () =>
      currentImageHeight * scale.value < screenHeight && translateY.value > 0
        ? 1 - translateY.value / quarterScreenHeight
        : currentImageHeight * scale.value > screenHeight &&
          translateY.value >
            (currentImageHeight / 2) * scale.value - halfScreenHeight
        ? 1 -
          (translateY.value -
            ((currentImageHeight / 2) * scale.value - halfScreenHeight)) /
            quarterScreenHeight
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
      opacity: interpolate(showScreen.value, [0, 0.01, 1], [0, 1, 1]),
      transform: [
        {
          translateY: interpolate(showScreen.value, [0, 1], [screenHeight, 0]),
        },
      ],
    }),
    [],
  );

  /**
   * Functions to open and close BottomSheet with image grid
   */
  const closeGridView = () => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.close();
    }
  };
  const openGridView = () => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.snapTo(1);
    }
  };

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[StyleSheet.absoluteFillObject, showScreenStyle]}
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
          >
            <Animated.View style={StyleSheet.absoluteFillObject}>
              <PinchGestureHandler
                onGestureEvent={onPinch}
                ref={pinchRef}
                simultaneousHandlers={[panRef]}
              >
                <Animated.View style={StyleSheet.absoluteFill}>
                  <PanGestureHandler
                    enabled={overlay === 'gallery'}
                    maxPointers={isAndroid ? undefined : 1}
                    minDist={10}
                    onGestureEvent={onPan}
                    ref={panRef}
                    simultaneousHandlers={[pinchRef]}
                  >
                    <Animated.View style={StyleSheet.absoluteFill}>
                      <Animated.View
                        style={[
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
                            index={i}
                            key={`${photo.uri}-${i}`}
                            offsetScale={offsetScale}
                            photo={photo}
                            previous={selectedIndex > i}
                            scale={scale}
                            selected={selectedIndex === i}
                            shouldRender={Math.abs(selectedIndex - i) < 4}
                            style={{
                              height: screenHeight * 8,
                              marginRight: MARGIN,
                              width: screenWidth * 8,
                            }}
                            translateX={translateX}
                            translateY={translateY}
                          />
                        ))}
                      </Animated.View>
                    </Animated.View>
                  </PanGestureHandler>
                </Animated.View>
              </PinchGestureHandler>
            </Animated.View>
          </TapGestureHandler>
        </Animated.View>
      </TapGestureHandler>
      <ImageGalleryHeader<Us>
        opacity={headerFooterOpacity}
        photo={photos[selectedIndex]}
        visible={headerFooterVisible}
        {...imageGalleryCustomComponents?.header}
      />
      <ImageGalleryFooter<Us>
        opacity={headerFooterOpacity}
        openGridView={openGridView}
        photo={photos[selectedIndex]}
        photoLength={photoLength}
        selectedIndex={selectedIndex}
        visible={headerFooterVisible}
        {...imageGalleryCustomComponents?.footer}
      />
      <ImageGalleryOverlay
        animatedBottomSheetIndex={animatedBottomSheetIndex}
        closeGridView={closeGridView}
        currentBottomSheetIndex={currentBottomSheetIndex}
      />
      <BottomSheet
        animatedPositionIndex={animatedBottomSheetIndex}
        handleComponent={() => (
          <ImageGridHandle
            closeGridView={closeGridView}
            {...imageGalleryCustomComponents?.gridHandle}
          />
        )}
        // @ts-expect-error
        handleHeight={imageGalleryGridHandleHeight ?? 40}
        initialSnapIndex={0}
        onChange={(index: number) => setCurrentBottomSheetIndex(index)}
        ref={bottomSheetRef}
        snapPoints={imageGalleryGridSnapPoints || [0, vh(90)]}
      >
        <ImageGrid
          closeGridView={closeGridView}
          numberOfImageGalleryGridColumns={numberOfImageGalleryGridColumns}
          photos={photos}
          resetVisibleValues={resetVisibleValues}
          setImage={setImage}
          {...imageGalleryCustomComponents?.grid}
        />
      </BottomSheet>
    </Animated.View>
  );
};

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

export type Photo<Us extends UnknownType = DefaultUserType> = {
  id: string;
  uri: string;
  created_at?: string | Date;
  messageId?: string;
  user?: UserResponse<Us> | null;
  user_id?: string;
};

ImageGallery.displayName = 'ImageGallery{imageGallery}';
