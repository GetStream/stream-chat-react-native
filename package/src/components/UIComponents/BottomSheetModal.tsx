import React, { PropsWithChildren, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  EventSubscription,
  Keyboard,
  KeyboardEvent,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import type { KeyboardEventData } from 'react-native-keyboard-controller';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheetProvider } from '../../contexts/bottomSheetContext/BottomSheetContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStableCallback } from '../../hooks';
import { KeyboardControllerPackage } from '../KeyboardCompatibleView/KeyboardControllerAvoidingView';

export type BottomSheetModalProps = {
  /**
   * Function to call when the modal is closed.
   * @returns void
   */
  onClose: () => void;
  /**
   * Whether the modal is visible.
   */
  visible: boolean;
  /**
   * The height of the modal.
   */
  height?: number;
  /**
   * Whether the sheet content should be lazy loaded or not. Particularly
   * useful when the content is something heavy and we don't want to disrupt
   * the animations while this is happening.
   */
  lazy?: boolean;
};

export const BottomSheetModal = (props: PropsWithChildren<BottomSheetModalProps>) => {
  const { height: windowHeight } = useWindowDimensions();
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
  const { children, height = windowHeight / 2, onClose, visible, lazy = false } = props;

  const {
    theme: {
      bottomSheetModal: { container, contentContainer, handle, overlay: overlayTheme },
    },
  } = useTheme();
  const styles = useStyles();

  const maxHeight = Math.max(
    0,
    windowHeight - topInset - (Platform.OS === 'android' ? bottomInset + 16 : 0),
  );

  const baseHeight = Math.min(height, maxHeight);
  const snapPoints = useMemo(() => [baseHeight, maxHeight], [baseHeight, maxHeight]);

  const translateY = useSharedValue(maxHeight);
  const keyboardOffset = useSharedValue(0);
  const currentSnapIndex = useSharedValue(0);

  const isOpen = useSharedValue(false);
  const isOpening = useSharedValue(false);

  const panStartY = useSharedValue(0);

  const [renderContent, setRenderContent] = useState(!lazy);

  const showContent = useStableCallback(() => {
    if (lazy) {
      setRenderContent(true);
    }
  });

  const hideContent = useStableCallback(() => {
    if (lazy) {
      setRenderContent(false);
    }
  });

  const close = useStableCallback((closeAnimationFinishedCallback?: () => void) => {
    // hide content immediately
    hideContent();

    isOpen.value = false;
    isOpening.value = false;

    cancelAnimation(translateY);

    const closeCallback = () => {
      onClose();
      if (closeAnimationFinishedCallback) {
        Platform.OS === 'ios'
          ? closeAnimationFinishedCallback()
          : setTimeout(() => closeAnimationFinishedCallback(), 100);
      }
    };

    translateY.value = withTiming(
      maxHeight,
      { duration: 250, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(closeCallback)();
      },
    );
  });

  // modal opening layout effect - we make sure to only show the content
  // after the animation has finished if `lazy` has been set to true
  useLayoutEffect(() => {
    if (!visible) return;

    isOpen.value = true;
    isOpening.value = true;
    currentSnapIndex.value = 0;

    cancelAnimation(translateY);

    // start from closed
    translateY.value = maxHeight;

    // Snapshot current keyboard offset as the open target.
    // If keyboard changes during opening, we’ll adjust after.
    const initialTarget = keyboardOffset.value + (maxHeight - snapPoints[currentSnapIndex.value]);

    translateY.value = withTiming(
      initialTarget,
      { duration: 250, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (!finished) return;

        // opening the modal has now truly finished
        isOpening.value = false;

        // reveal the content if we want to load it lazily
        runOnJS(showContent)();

        // if keyboard offset changed while we were opening, we do a
        // follow-up adjustment (we do not gate the content however)
        const latestTarget =
          keyboardOffset.value + (maxHeight - snapPoints[currentSnapIndex.value]);
        if (latestTarget !== initialTarget && isOpen.value) {
          cancelAnimation(translateY);
          translateY.value = withTiming(latestTarget, {
            duration: 250,
            easing: Easing.inOut(Easing.ease),
          });
        }
      },
    );
  }, [
    visible,
    hideContent,
    isOpen,
    isOpening,
    keyboardOffset,
    maxHeight,
    snapPoints,
    showContent,
    translateY,
    currentSnapIndex,
  ]);

  // if `visible` gets hard changed, we force a cleanup
  useEffect(() => {
    if (visible) return;

    isOpen.value = false;
    isOpening.value = false;
    keyboardOffset.value = 0;
    currentSnapIndex.value = 0;

    cancelAnimation(translateY);
    translateY.value = maxHeight;
  }, [visible, maxHeight, isOpen, isOpening, keyboardOffset, translateY, currentSnapIndex]);

  const keyboardDidShowRN = useStableCallback((event: KeyboardEvent) => {
    const offset = -event.endCoordinates.height;
    keyboardOffset.value = offset;

    // We just record the offset, but we avoid cancelling the animation
    // if it's in the process of opening. The same logic applies to all
    // other keyboard related callbacks in this specific conditional.
    if (!isOpen.value || isOpening.value) return;

    cancelAnimation(translateY);
    translateY.value = withTiming(offset + (maxHeight - snapPoints[currentSnapIndex.value]), {
      duration: 250,
      easing: Easing.inOut(Easing.ease),
    });
  });

  const keyboardDidHide = useStableCallback(() => {
    keyboardOffset.value = 0;

    if (!isOpen.value || isOpening.value) return;

    cancelAnimation(translateY);
    translateY.value = withTiming(maxHeight - snapPoints[currentSnapIndex.value], {
      duration: 250,
      easing: Easing.inOut(Easing.ease),
    });
  });

  useEffect(() => {
    if (!visible) return;

    const listeners: EventSubscription[] = [];

    if (KeyboardControllerPackage?.KeyboardEvents) {
      const keyboardDidShowKC = (event: KeyboardEventData) => {
        const offset = -event.height;
        keyboardOffset.value = offset;

        if (!isOpen.value || isOpening.value) return;

        cancelAnimation(translateY);
        translateY.value = withTiming(offset + (maxHeight - snapPoints[currentSnapIndex.value]), {
          duration: 250,
          easing: Easing.inOut(Easing.ease),
        });
      };

      listeners.push(
        KeyboardControllerPackage.KeyboardEvents.addListener('keyboardDidShow', keyboardDidShowKC),
        KeyboardControllerPackage.KeyboardEvents.addListener('keyboardDidHide', keyboardDidHide),
      );
    } else {
      listeners.push(Keyboard.addListener('keyboardDidShow', keyboardDidShowRN));
      listeners.push(Keyboard.addListener('keyboardDidHide', keyboardDidHide));
    }

    return () => listeners.forEach((l) => l.remove());
  }, [
    visible,
    keyboardDidHide,
    keyboardDidShowRN,
    keyboardOffset,
    isOpen,
    isOpening,
    translateY,
    maxHeight,
    snapPoints,
    currentSnapIndex,
  ]);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    paddingBottom: translateY.value,
  }));

  const backdropThreshold = baseHeight;

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    const visibleHeight = Math.max(0, maxHeight - (translateY.value - keyboardOffset.value));
    const threshold = Math.max(1, Math.min(backdropThreshold, maxHeight));
    const progress = Math.min(1, visibleHeight / threshold);
    return { opacity: progress };
  });

  const snapPointsTranslateY = useMemo(
    () => snapPoints.map((point) => maxHeight - point),
    [maxHeight, snapPoints],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        // disable pan until content is rendered (prevents canceling the opening timing).
        .enabled(renderContent)
        .onBegin(() => {
          cancelAnimation(translateY);
          panStartY.value = translateY.value;
        })
        .onUpdate((event) => {
          const minY = keyboardOffset.value + (maxHeight - snapPoints[snapPoints.length - 1]);
          const next = panStartY.value + event.translationY;
          translateY.value = Math.max(next, minY);
        })
        .onEnd((event) => {
          const openY = keyboardOffset.value + (maxHeight - snapPoints[currentSnapIndex.value]);
          const draggedDown = Math.max(translateY.value - openY, 0);
          const topSnapIndex = snapPoints.length - 1;
          const isAtTopSnap = currentSnapIndex.value === topSnapIndex;
          const snap0Y = keyboardOffset.value + (maxHeight - snapPoints[0]);
          const projectedY = translateY.value + event.velocityY * 0.2;

          // From lower snaps, keep the previous close behavior.
          const shouldCloseFromLowerSnap = event.velocityY > 500 || draggedDown > maxHeight / 2;
          // From top snap, close only for clearly hard downward intent.
          const shouldCloseFromTopSnap =
            event.velocityY > 2200 || projectedY > snap0Y + (maxHeight - snap0Y) * 0.96;

          const shouldClose = isAtTopSnap ? shouldCloseFromTopSnap : shouldCloseFromLowerSnap;

          cancelAnimation(translateY);

          if (shouldClose) {
            isOpen.value = false;
            isOpening.value = false;

            translateY.value = withTiming(
              maxHeight,
              { duration: 250, easing: Easing.out(Easing.cubic) },
              (finished) => {
                if (finished) runOnJS(onClose)();
              },
            );
          } else {
            isOpen.value = true;
            // snap to the nearest point
            let nearestIndex = 0;
            let minDistance = Number.POSITIVE_INFINITY;
            const baseOffset = keyboardOffset.value;
            for (let i = 0; i < snapPointsTranslateY.length; i += 1) {
              const candidate = baseOffset + snapPointsTranslateY[i];
              const distance = Math.abs(translateY.value - candidate);
              if (distance < minDistance) {
                minDistance = distance;
                nearestIndex = i;
              }
            }
            // velocity-based snapping, fast upward swipe goes to top snap point
            if (event.velocityY < -800) {
              nearestIndex = snapPointsTranslateY.length - 1;
            }
            // From top snap, a gentle downward flick should settle to snap 0
            // without requiring a large drag distance.
            if (isAtTopSnap && event.velocityY > 120) {
              nearestIndex = 0;
            }
            currentSnapIndex.value = nearestIndex;
            translateY.value = withTiming(baseOffset + snapPointsTranslateY[nearestIndex], {
              duration: 250,
              easing: Easing.inOut(Easing.ease),
            });
          }
        }),
    [
      currentSnapIndex,
      isOpen,
      isOpening,
      keyboardOffset,
      maxHeight,
      onClose,
      panStartY,
      renderContent,
      snapPoints,
      snapPointsTranslateY,
      translateY,
    ],
  );

  const onBackdropPress = useStableCallback(() => close());

  const bottomSheetModalContextValue = useMemo(
    () => ({
      close,
      currentSnapIndex,
    }),
    [close, currentSnapIndex],
  );

  return (
    <Modal onRequestClose={onClose} transparent visible={visible}>
      <GestureHandlerRootView style={styles.sheetContentContainer}>
        <GestureDetector gesture={panGesture}>
          <View style={[styles.overlay, overlayTheme]}>
            <Animated.View pointerEvents='none' style={[styles.backdrop, overlayAnimatedStyle]} />
            <Pressable onPress={onBackdropPress} style={StyleSheet.absoluteFillObject} />

            <Animated.View
              style={[styles.container, { height: maxHeight }, sheetAnimatedStyle, container]}
            >
              <View style={[styles.handle, handle]} />
              <View style={[styles.contentContainer, contentContainer]}>
                {renderContent ? (
                  <BottomSheetProvider value={bottomSheetModalContextValue}>
                    <Animated.View
                      entering={FadeIn.duration(250)}
                      style={styles.sheetContentContainer}
                    >
                      {children}
                    </Animated.View>
                  </BottomSheetProvider>
                ) : null}
              </View>
            </Animated.View>
          </View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          backgroundColor: semantics.backgroundCoreElevation1,
        },
        contentContainer: {
          flex: 1,
          marginTop: 8,
        },
        handle: {
          alignSelf: 'center',
          borderRadius: 4,
          height: 4,
          marginVertical: 8,
          backgroundColor: '#919191',
          width: 32,
        },
        overlay: {
          flex: 1,
          justifyContent: 'flex-end',
        },
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: semantics.backgroundCoreScrim,
        },
        sheetContentContainer: {
          flex: 1,
        },
      }),
    [semantics.backgroundCoreScrim, semantics.backgroundCoreElevation1],
  );
};
