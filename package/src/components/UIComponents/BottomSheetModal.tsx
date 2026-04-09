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
  LayoutChangeEvent,
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
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getBottomSheetBaseHeight,
  getBottomSheetSnapPointTranslateY,
  getBottomSheetTopSnapIndex,
} from './BottomSheetModal.utils';

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
   * Whether the sheet should wrap its content up to the provided `height`.
   */
  enableDynamicSizing?: boolean;
  /**
   * Whether the sheet content should be lazy loaded or not. Particularly
   * useful when the content is something heavy and we don't want to disrupt
   * the animations while this is happening.
   */
  lazy?: boolean;
};

const BottomSheetModalInner = (props: PropsWithChildren<BottomSheetModalProps>) => {
  const { height: windowHeight } = useWindowDimensions();
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
  const {
    children,
    enableDynamicSizing = false,
    height = windowHeight / 2,
    onClose,
    visible,
    lazy = false,
  } = props;

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
  const fixedBaseHeight = Math.min(height, maxHeight);

  const contentHeight = useSharedValue<number | undefined>(undefined);
  const baseHeight = useDerivedValue(
    () =>
      getBottomSheetBaseHeight({
        bottomInset,
        contentHeight: contentHeight.value,
        enableDynamicSizing,
        height,
        maxHeight,
      }),
    [bottomInset, contentHeight, enableDynamicSizing, height, maxHeight],
  );
  const topSnapIndex = useDerivedValue<number>(
    () =>
      getBottomSheetTopSnapIndex({
        baseHeight: baseHeight.value,
        maxHeight,
      }),
    [baseHeight, maxHeight],
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

  const handleDynamicContentLayout = useStableCallback((event: LayoutChangeEvent) => {
    if (!enableDynamicSizing) {
      return;
    }

    const nextContentHeight = Math.ceil(event.nativeEvent.layout.height);

    if (contentHeight.value === nextContentHeight) {
      return;
    }

    contentHeight.value = nextContentHeight;
  });

  const open = useStableCallback((shouldShowContentAfterOpen = true) => {
    sheetTranslateY.value = withTiming(
      maxHeight - fixedBaseHeight,
      { duration: 250, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (!finished) return;

        isOpening.value = false;

        if (shouldShowContentAfterOpen) {
          runOnJS(showContent)();
        }
      },
    );
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

    if (enableDynamicSizing) {
      setRenderContent(true);
      return;
    }

    open();
  }, [
    enableDynamicSizing,
    visible,
    isOpen,
    isOpening,
    maxHeight,
    open,
    sheetTranslateY,
    currentSnapIndex,
  ]);

  useAnimatedReaction(
    () => {
      if (
        !visible ||
        !enableDynamicSizing ||
        !isOpening.value ||
        contentHeight.value === undefined
      ) {
        return undefined;
      }

      return getBottomSheetSnapPointTranslateY({
        baseHeight: baseHeight.value,
        maxHeight,
        snapIndex: 0,
      });
    },
    (nextTranslateY, prevTranslateY) => {
      if (nextTranslateY === undefined || nextTranslateY === prevTranslateY) {
        return;
      }

      sheetTranslateY.value = withTiming(
        nextTranslateY,
        { duration: 250, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (finished) {
            isOpening.value = false;
          }
        },
      );
    },
    [
      baseHeight,
      contentHeight,
      enableDynamicSizing,
      isOpening,
      maxHeight,
      sheetTranslateY,
      visible,
    ],
  );

  // if `visible` gets hard changed, we force a cleanup
  useEffect(() => {
    if (visible) return;

    isOpen.value = false;
    isOpening.value = false;
    keyboardOffset.value = 0;
    currentSnapIndex.value = 0;
    sheetTranslateY.value = maxHeight;
    contentHeight.value = undefined;
    setRenderContent(!lazy);
  }, [
    contentHeight,
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
  useAnimatedReaction(
    () => {
      if (!visible || !isOpen.value || isOpening.value) {
        return undefined;
      }

      const clampedSnapIndex = Math.min(currentSnapIndex.value, topSnapIndex.value);

      return {
        snapIndex: clampedSnapIndex,
        translateY: getBottomSheetSnapPointTranslateY({
          baseHeight: baseHeight.value,
          maxHeight,
          snapIndex: clampedSnapIndex,
        }),
      };
    },
    (nextTarget) => {
      if (!nextTarget) {
        return;
      }

      if (currentSnapIndex.value !== nextTarget.snapIndex) {
        currentSnapIndex.value = nextTarget.snapIndex;
      }

      if (Math.abs(sheetTranslateY.value - nextTarget.translateY) < 1) {
        return;
      }

      sheetTranslateY.value = withTiming(nextTarget.translateY, {
        duration: 250,
        easing: Easing.inOut(Easing.ease),
      });
    },
    [
      baseHeight,
      currentSnapIndex,
      isOpen,
      isOpening,
      maxHeight,
      sheetTranslateY,
      topSnapIndex,
      visible,
    ],
  );

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
    transform: [{ translateY: sheetTranslateY.value - keyboardOffset.value }],
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    const visibleHeight = Math.max(0, maxHeight - sheetTranslateY.value);
    const threshold = Math.max(1, Math.min(baseHeight.value, maxHeight));
    const progress = Math.min(1, visibleHeight / threshold);
    return { opacity: progress };
  }, [baseHeight, maxHeight]);

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
          const openTranslateY = getBottomSheetSnapPointTranslateY({
            baseHeight: baseHeight.value,
            maxHeight,
            snapIndex: currentSnapIndex.value,
          });
          const draggedDown = Math.max(sheetTranslateY.value - openTranslateY, 0);
          const hasMultipleSnapPoints = topSnapIndex.value > 0;
          const isAtTopSnap = currentSnapIndex.value === topSnapIndex.value;
          const snap0TranslateY = getBottomSheetSnapPointTranslateY({
            baseHeight: baseHeight.value,
            maxHeight,
            snapIndex: 0,
          });
          const topSnapTranslateY = getBottomSheetSnapPointTranslateY({
            baseHeight: baseHeight.value,
            maxHeight,
            snapIndex: topSnapIndex.value,
          });
          const projectedTranslateY = sheetTranslateY.value + event.velocityY * 0.2;

          const shouldCloseFromLowerSnap = event.velocityY > 500 || draggedDown > maxHeight / 2;
          const shouldCloseFromTopSnap =
            event.velocityY > 2200 ||
            projectedTranslateY > snap0TranslateY + (maxHeight - snap0TranslateY) * 0.96;

          const shouldClose = !hasMultipleSnapPoints
            ? shouldCloseFromLowerSnap
            : isAtTopSnap
              ? shouldCloseFromTopSnap
              : shouldCloseFromLowerSnap;

          if (shouldClose) {
            runOnJS(closeFromGesture)();
          } else {
            isOpen.value = true;
            let nearestIndex = 0;
            let minDistance = Math.abs(sheetTranslateY.value - snap0TranslateY);

            if (hasMultipleSnapPoints) {
              const topDistance = Math.abs(sheetTranslateY.value - topSnapTranslateY);
              if (topDistance < minDistance) {
                minDistance = topDistance;
                nearestIndex = topSnapIndex.value;
              }
            }

            // velocity-based snapping, fast upward swipe goes to top snap point
            if (hasMultipleSnapPoints && event.velocityY < -800) {
              nearestIndex = topSnapIndex.value;
            }
            // From top snap, a gentle downward flick should settle to snap 0
            // without requiring a large drag distance.
            if (hasMultipleSnapPoints && isAtTopSnap && event.velocityY > 120) {
              nearestIndex = 0;
            }

            currentSnapIndex.value = nearestIndex;
            sheetTranslateY.value = withTiming(
              getBottomSheetSnapPointTranslateY({
                baseHeight: baseHeight.value,
                maxHeight,
                snapIndex: nearestIndex,
              }),
              {
                duration: 250,
                easing: Easing.inOut(Easing.ease),
              },
            );
          }
        }),
    [
      baseHeight,
      currentSnapIndex,
      isOpen,
      maxHeight,
      closeFromGesture,
      panStartTranslateY,
      renderContent,
      sheetTranslateY,
      topSnapIndex,
    ],
  );

  const onBackdropPress = useStableCallback(() => close());

  const bottomSheetModalContextValue = useMemo(
    () => ({
      close,
      currentSnapIndex,
      topSnapIndex,
    }),
    [close, currentSnapIndex, topSnapIndex],
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
                        {enableDynamicSizing ? (
                          <View
                            onLayout={handleDynamicContentLayout}
                            style={{ paddingBottom: bottomInset }}
                          >
                            {children}
                          </View>
                        ) : (
                          children
                        )}
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

export const BottomSheetModal = (props: PropsWithChildren<BottomSheetModalProps>) => {
  if (!props.visible) {
    return null;
  }

  return <BottomSheetModalInner {...props} />;
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
