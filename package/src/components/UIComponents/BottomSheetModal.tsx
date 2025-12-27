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
  onClose: () => void;
  visible: boolean;
  height?: number;
};

export const BottomSheetModal = (props: PropsWithChildren<BottomSheetModalProps>) => {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const { children, height = windowHeight / 2, onClose, visible } = props;

  const {
    theme: {
      bottomSheetModal: { container, contentContainer, handle, overlay: overlayTheme, wrapper },
      colors: { grey, overlay, white_snow },
    },
  } = useTheme();

  const translateY = useSharedValue(height);
  const keyboardOffset = useSharedValue(0);
  const isOpen = useSharedValue(false);

  const panStartY = useSharedValue(0);

  const [renderContent, setRenderContent] = useState(false);

  const close = useStableCallback(() => {
    // close always goes fully off-screen and only then notifies JS
    setRenderContent(false);

    isOpen.value = false;
    cancelAnimation(translateY);
    translateY.value = withTiming(height, { duration: 200 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  });

  // Open animation: keep it simple (setting shared values from JS still runs on UI)
  useLayoutEffect(() => {
    if (!visible) return;

    isOpen.value = true;
    keyboardOffset.value = 0;

    // clean up any leftover animations
    cancelAnimation(translateY);
    // kick animation on UI thread so JS congestion can't delay the start; only render content
    // once the animation finishes
    translateY.value = height;

    translateY.value = withTiming(
      keyboardOffset.value,
      { duration: 200, easing: Easing.inOut(Easing.ease) },
      (finished) => {
        if (finished) runOnJS(setRenderContent)(true);
      },
    );
  }, [visible, height, isOpen, keyboardOffset, translateY]);

  // if `visible` gets hard changed, we force a cleanup
  useEffect(() => {
    if (visible) return;

    setRenderContent(false);

    isOpen.value = false;
    keyboardOffset.value = 0;

    cancelAnimation(translateY);
    translateY.value = height;
  }, [visible, height, isOpen, keyboardOffset, translateY]);

  const keyboardDidShow = useStableCallback((event: KeyboardEvent) => {
    const offset = -event.endCoordinates.height;
    keyboardOffset.value = offset;

    if (isOpen.value) {
      cancelAnimation(translateY);
      translateY.value = withTiming(offset, {
        duration: 250,
        easing: Easing.inOut(Easing.ease),
      });
    }
  });

  const keyboardDidHide = useStableCallback(() => {
    keyboardOffset.value = 0;

    if (isOpen.value) {
      cancelAnimation(translateY);
      translateY.value = withTiming(0, {
        duration: 250,
        easing: Easing.inOut(Easing.ease),
      });
    }
  });

  useEffect(() => {
    if (!visible) return;

    const listeners: EventSubscription[] = [];

    if (KeyboardControllerPackage?.KeyboardEvents) {
      const keyboardDidShow = (event: KeyboardEventData) => {
        const offset = -event.height;
        keyboardOffset.value = offset;

        if (isOpen.value) {
          cancelAnimation(translateY);
          translateY.value = withTiming(offset, {
            duration: 250,
            easing: Easing.inOut(Easing.ease),
          });
        }
      };

      listeners.push(
        KeyboardControllerPackage.KeyboardEvents.addListener('keyboardDidShow', keyboardDidShow),
        KeyboardControllerPackage.KeyboardEvents.addListener('keyboardDidHide', keyboardDidHide),
      );
    } else {
      listeners.push(Keyboard.addListener('keyboardDidShow', keyboardDidShow));
      listeners.push(Keyboard.addListener('keyboardDidHide', keyboardDidHide));
    }
    return () => {
      listeners.forEach((listener) => listener.remove());
    };
  }, [visible, keyboardDidHide, keyboardDidShow, keyboardOffset, isOpen, translateY]);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(() => {
          cancelAnimation(translateY);
          panStartY.value = translateY.value;
        })
        .onUpdate((event) => {
          const minY = keyboardOffset.value;
          translateY.value = Math.max(panStartY.value + event.translationY, minY);
        })
        .onEnd((event) => {
          const openY = keyboardOffset.value;
          const draggedDown = Math.max(translateY.value - openY, 0);
          const shouldClose = event.velocityY > 500 || draggedDown > height / 2;

          cancelAnimation(translateY);

          if (shouldClose) {
            isOpen.value = false;
            translateY.value = withTiming(height, { duration: 100 }, (finished) => {
              if (finished) runOnJS(onClose)();
            });
          } else {
            isOpen.value = true;
            translateY.value = withTiming(openY, {
              duration: 200,
              easing: Easing.inOut(Easing.ease),
            });
          }
        }),
    [height, isOpen, keyboardOffset, onClose, panStartY, translateY],
  );

  return (
    <View style={[styles.wrapper, wrapper]}>
      <Modal onRequestClose={onClose} transparent visible={visible}>
        <GestureHandlerRootView style={{ flex: 1 }}>
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
                    <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1 }}>
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
  wrapper: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
