import React, { PropsWithChildren, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  EventSubscription,
  Keyboard,
  KeyboardEvent,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
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

// TODO: V9: Animate the backdrop as well.
export const BottomSheetModal = (props: PropsWithChildren<BottomSheetModalProps>) => {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const { children, height = windowHeight / 2, onClose, visible, lazy = false } = props;

  const {
    theme: {
      bottomSheetModal: { container, contentContainer, handle, overlay: overlayTheme, wrapper },
      colors: { grey, overlay, white_snow },
    },
  } = useTheme();

  const translateY = useSharedValue(height);
  const keyboardOffset = useSharedValue(0);

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

  const close = useStableCallback(() => {
    // hide content immediately
    hideContent();

    isOpen.value = false;
    isOpening.value = false;

    cancelAnimation(translateY);

    translateY.value = withTiming(
      height,
      { duration: 180, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(onClose)();
      },
    );
  });

  // modal opening layout effect - we make sure to only show the content
  // after the animation has finished if `lazy` has been set to true
  useLayoutEffect(() => {
    if (!visible) return;

    isOpen.value = true;
    isOpening.value = true;

    cancelAnimation(translateY);

    // start from closed
    translateY.value = height;

    // Snapshot current keyboard offset as the open target.
    // If keyboard changes during opening, we’ll adjust after.
    const initialTarget = keyboardOffset.value;

    translateY.value = withTiming(
      initialTarget,
      { duration: 220, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (!finished) return;

        // opening the modal has now truly finished
        isOpening.value = false;

        // reveal the content if we want to load it lazily
        runOnJS(showContent)();

        // if keyboard offset changed while we were opening, we do a
        // follow-up adjustment (we do not gate the content however)
        const latestTarget = keyboardOffset.value;
        if (latestTarget !== initialTarget && isOpen.value) {
          cancelAnimation(translateY);
          translateY.value = withTiming(latestTarget, {
            duration: 200,
            easing: Easing.inOut(Easing.ease),
          });
        }
      },
    );
  }, [visible, height, hideContent, isOpen, isOpening, keyboardOffset, showContent, translateY]);

  // if `visible` gets hard changed, we force a cleanup
  useEffect(() => {
    if (visible) return;

    isOpen.value = false;
    isOpening.value = false;
    keyboardOffset.value = 0;

    cancelAnimation(translateY);
    translateY.value = height;
  }, [visible, height, isOpen, isOpening, keyboardOffset, translateY]);

  const keyboardDidShowRN = useStableCallback((event: KeyboardEvent) => {
    const offset = -event.endCoordinates.height;
    keyboardOffset.value = offset;

    // We just record the offset, but we avoid cancelling the animation
    // if it's in the process of opening. The same logic applies to all
    // other keyboard related callbacks in this specific conditional.
    if (!isOpen.value || isOpening.value) return;

    cancelAnimation(translateY);
    translateY.value = withTiming(offset, { duration: 250, easing: Easing.inOut(Easing.ease) });
  });

  const keyboardDidHide = useStableCallback(() => {
    keyboardOffset.value = 0;

    if (!isOpen.value || isOpening.value) return;

    cancelAnimation(translateY);
    translateY.value = withTiming(0, { duration: 250, easing: Easing.inOut(Easing.ease) });
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
        translateY.value = withTiming(offset, { duration: 250, easing: Easing.inOut(Easing.ease) });
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
  }, [visible, keyboardDidHide, keyboardDidShowRN, keyboardOffset, isOpen, isOpening, translateY]);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        // disable pan until content is rendered (prevents canceling the opening timing).
        .enabled(renderContent)
        .onBegin(() => {
          cancelAnimation(translateY);
          panStartY.value = translateY.value;
        })
        .onUpdate((event) => {
          const minY = keyboardOffset.value;
          const next = panStartY.value + event.translationY;
          translateY.value = Math.max(next, minY);
        })
        .onEnd((event) => {
          const openY = keyboardOffset.value;
          const draggedDown = Math.max(translateY.value - openY, 0);
          const shouldClose = event.velocityY > 500 || draggedDown > height / 2;

          cancelAnimation(translateY);

          if (shouldClose) {
            isOpen.value = false;
            isOpening.value = false;

            translateY.value = withTiming(
              height,
              { duration: 140, easing: Easing.out(Easing.cubic) },
              (finished) => {
                if (finished) runOnJS(onClose)();
              },
            );
          } else {
            isOpen.value = true;
            translateY.value = withTiming(openY, {
              duration: 200,
              easing: Easing.inOut(Easing.ease),
            });
          }
        }),
    [height, isOpen, isOpening, keyboardOffset, onClose, panStartY, renderContent, translateY],
  );

  return (
    <View style={[styles.wrapper, wrapper]}>
      <Modal onRequestClose={onClose} transparent visible={visible}>
        <GestureHandlerRootView style={styles.sheetContentContainer}>
          <GestureDetector gesture={gesture}>
            <View style={[styles.overlay, { backgroundColor: overlay }, overlayTheme]}>
              <TouchableWithoutFeedback onPress={close}>
                <View style={{ flex: 1 }} />
              </TouchableWithoutFeedback>

              <Animated.View
                style={[
                  styles.container,
                  { backgroundColor: white_snow, height },
                  sheetAnimatedStyle,
                  container,
                ]}
              >
                <View
                  style={[styles.handle, { backgroundColor: grey, width: windowWidth / 4 }, handle]}
                />
                <View style={[styles.contentContainer, contentContainer]}>
                  {renderContent ? (
                    <Animated.View
                      entering={FadeIn.duration(250)}
                      style={styles.sheetContentContainer}
                    >
                      {children}
                    </Animated.View>
                  ) : null}
                </View>
              </Animated.View>
            </View>
          </GestureDetector>
        </GestureHandlerRootView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetContentContainer: {
    flex: 1,
  },
  wrapper: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
