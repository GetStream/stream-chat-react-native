import React, {
  PropsWithChildren,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import { primitives } from '../../theme';
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
  const snapPointsTranslateY = useMemo(
    () => snapPoints.map((point) => maxHeight - point),
    [maxHeight, snapPoints],
  );

  const sheetTranslateY = useSharedValue(maxHeight);
  const keyboardOffset = useSharedValue(0);
  const currentSnapIndex = useSharedValue(0);

  const isOpen = useSharedValue(false);
  const isOpening = useSharedValue(false);

  const panStartTranslateY = useSharedValue(0);
  const hasCommittedVisibilityRef = useRef(false);
  const wasVisibleRef = useRef(false);

  const [renderContent, setRenderContent] = useState(!lazy);

  const showContent = useStableCallback(() => {
    if (lazy) {
      setRenderContent(true);
    }
  });

  const finishClose = useStableCallback((closeAnimationFinishedCallback?: () => void) => {
    onClose();
    if (closeAnimationFinishedCallback) {
      Platform.OS === 'ios'
        ? closeAnimationFinishedCallback()
        : setTimeout(() => closeAnimationFinishedCallback(), 100);
    }
  });

  const closeFromGesture = useStableCallback(() => {
    requestAnimationFrame(() => {
      isOpen.value = false;
      isOpening.value = false;

      sheetTranslateY.value = withTiming(
        maxHeight,
        { duration: 250, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (finished) {
            runOnJS(onClose)();
          }
        },
      );
    });
  });

  const close = useStableCallback((closeAnimationFinishedCallback?: () => void) => {
    if (!visible || !isOpen.value) {
      return;
    }

    isOpen.value = false;
    isOpening.value = false;

    sheetTranslateY.value = withTiming(
      maxHeight,
      { duration: 250, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(finishClose)(closeAnimationFinishedCallback);
        }
      },
    );
  });

  // modal opening layout effect - we make sure to only show the content
  // after the animation has finished if `lazy` has been set to true
  useLayoutEffect(() => {
    const wasVisible = hasCommittedVisibilityRef.current ? wasVisibleRef.current : false;
    hasCommittedVisibilityRef.current = true;
    wasVisibleRef.current = visible;

    if (!visible || wasVisible) {
      return;
    }

    isOpen.value = true;
    isOpening.value = true;
    currentSnapIndex.value = 0;
    sheetTranslateY.value = maxHeight;

    sheetTranslateY.value = withTiming(
      snapPointsTranslateY[0],
      { duration: 250, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (!finished) return;

        isOpening.value = false;
        runOnJS(showContent)();
      },
    );
  }, [
    visible,
    isOpen,
    isOpening,
    maxHeight,
    showContent,
    sheetTranslateY,
    currentSnapIndex,
    snapPointsTranslateY,
  ]);

  // if `visible` gets hard changed, we force a cleanup
  useEffect(() => {
    if (visible) return;

    isOpen.value = false;
    isOpening.value = false;
    keyboardOffset.value = 0;
    currentSnapIndex.value = 0;
    sheetTranslateY.value = maxHeight;
    setRenderContent(!lazy);
  }, [
    visible,
    lazy,
    isOpen,
    isOpening,
    keyboardOffset,
    maxHeight,
    sheetTranslateY,
    currentSnapIndex,
  ]);

  // Keep the sheet aligned with the active snap if dimensions change while visible.
  useEffect(() => {
    if (!visible || !isOpen.value || isOpening.value) {
      return;
    }

    sheetTranslateY.value = withTiming(snapPointsTranslateY[currentSnapIndex.value], {
      duration: 250,
      easing: Easing.inOut(Easing.ease),
    });
  }, [visible, isOpen, isOpening, sheetTranslateY, currentSnapIndex, snapPointsTranslateY]);

  const animateKeyboardOffset = useStableCallback((offset: number) => {
    keyboardOffset.value = withTiming(offset, {
      duration: 250,
      easing: Easing.inOut(Easing.ease),
    });
  });

  const keyboardDidShowRN = useStableCallback((event: KeyboardEvent) => {
    animateKeyboardOffset(event.endCoordinates.height);
  });

  const keyboardDidHide = useStableCallback(() => {
    animateKeyboardOffset(0);
  });

  useEffect(() => {
    if (!visible) return;

    const listeners: EventSubscription[] = [];

    if (KeyboardControllerPackage?.KeyboardEvents) {
      const keyboardDidShowKC = (event: KeyboardEventData) => {
        animateKeyboardOffset(event.height);
      };

      listeners.push(
        KeyboardControllerPackage.KeyboardEvents.addListener('keyboardDidShow', keyboardDidShowKC),
        KeyboardControllerPackage.KeyboardEvents.addListener('keyboardDidHide', keyboardDidHide),
      );
    } else if (Platform.OS === 'ios') {
      listeners.push(Keyboard.addListener('keyboardWillShow', keyboardDidShowRN));
      listeners.push(Keyboard.addListener('keyboardWillHide', keyboardDidHide));
    }

    return () => listeners.forEach((l) => l.remove());
  }, [visible, animateKeyboardOffset, keyboardDidHide, keyboardDidShowRN]);

  const sheetViewportAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
    paddingBottom: sheetTranslateY.value,
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    const visibleHeight = Math.max(0, maxHeight - sheetTranslateY.value);
    const threshold = Math.max(1, Math.min(baseHeight, maxHeight));
    const progress = Math.min(1, visibleHeight / threshold);
    return { opacity: progress };
  });

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(renderContent)
        .onBegin(() => {
          panStartTranslateY.value = sheetTranslateY.value;
        })
        .onUpdate((event) => {
          const nextTranslateY = panStartTranslateY.value + event.translationY;
          sheetTranslateY.value = Math.min(Math.max(nextTranslateY, 0), maxHeight);
        })
        .onEnd((event) => {
          const openTranslateY = snapPointsTranslateY[currentSnapIndex.value];
          const draggedDown = Math.max(sheetTranslateY.value - openTranslateY, 0);
          const topSnapIndex = snapPoints.length - 1;
          const isAtTopSnap = currentSnapIndex.value === topSnapIndex;
          const snap0TranslateY = snapPointsTranslateY[0];
          const projectedTranslateY = sheetTranslateY.value + event.velocityY * 0.2;

          const shouldCloseFromLowerSnap = event.velocityY > 500 || draggedDown > maxHeight / 2;
          const shouldCloseFromTopSnap =
            event.velocityY > 2200 ||
            projectedTranslateY > snap0TranslateY + (maxHeight - snap0TranslateY) * 0.96;

          const shouldClose = isAtTopSnap ? shouldCloseFromTopSnap : shouldCloseFromLowerSnap;

          if (shouldClose) {
            runOnJS(closeFromGesture)();
          } else {
            isOpen.value = true;
            let nearestIndex = 0;
            let minDistance = Number.POSITIVE_INFINITY;
            for (let i = 0; i < snapPointsTranslateY.length; i += 1) {
              const candidate = snapPointsTranslateY[i];
              const distance = Math.abs(sheetTranslateY.value - candidate);
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
            sheetTranslateY.value = withTiming(snapPointsTranslateY[nearestIndex], {
              duration: 250,
              easing: Easing.inOut(Easing.ease),
            });
          }
        }),
    [
      currentSnapIndex,
      isOpen,
      maxHeight,
      closeFromGesture,
      panStartTranslateY,
      renderContent,
      snapPoints,
      snapPointsTranslateY,
      sheetTranslateY,
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
        <View style={[styles.overlay, overlayTheme]}>
          <Animated.View pointerEvents='none' style={[styles.backdrop, overlayAnimatedStyle]} />
          <Pressable onPress={onBackdropPress} style={StyleSheet.absoluteFillObject} />

          <Animated.View
            pointerEvents='box-none'
            style={[{ height: maxHeight }, sheetViewportAnimatedStyle]}
          >
            <GestureDetector gesture={panGesture}>
              <Animated.View style={[styles.container, { height: maxHeight }, container]}>
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
            </GestureDetector>
          </Animated.View>
        </View>
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
          borderTopLeftRadius: primitives.radius4xl,
          borderTopRightRadius: primitives.radius4xl,
          backgroundColor: semantics.backgroundCoreElevation1,
        },
        contentContainer: {
          flex: 1,
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
