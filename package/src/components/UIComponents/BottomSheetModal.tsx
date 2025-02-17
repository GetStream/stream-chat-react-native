import React, { PropsWithChildren, useEffect } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  useWindowDimensions,
  TouchableWithoutFeedback,
  View,
  Keyboard,
  KeyboardEvent,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';

import { runOnJS } from 'react-native-reanimated';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

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
};

/**
 * A modal that slides up from the bottom of the screen.
 */
export const BottomSheetModal = (props: PropsWithChildren<BottomSheetModalProps>) => {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const { children, height = windowHeight / 2, onClose, visible } = props;
  const {
    theme: {
      bottomSheetModal: { container, contentContainer, handle, overlay: overlayTheme },
      colors: { grey, overlay, white_snow },
    },
  } = useTheme();

  const translateY = new Animated.Value(height);

  const openAnimation = Animated.timing(translateY, {
    duration: 200,
    toValue: 0,
    useNativeDriver: true,
  });

  const closeAnimation = Animated.timing(translateY, {
    duration: 50,
    toValue: height,
    useNativeDriver: true,
  });

  const handleDismiss = () => {
    closeAnimation.start(() => onClose());
  };

  useEffect(() => {
    if (visible) {
      openAnimation.start();
    }
  }, [visible, openAnimation]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', keyboardDidShow);
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', keyboardDidHide);

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const keyboardDidShow = (event: KeyboardEvent) => {
    Animated.timing(translateY, {
      duration: 250,
      toValue: -event.endCoordinates.height,
      useNativeDriver: true,
    }).start();
  };

  const keyboardDidHide = () => {
    Animated.timing(translateY, {
      duration: 250,
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const handleUpdate = (event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
    const translationY = Math.max(event.translationY, 0);
    translateY.setValue(translationY);
  };

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      runOnJS(handleUpdate)(event);
    })
    .onEnd((event) => {
      if (event.velocityY > 500 || event.translationY > height / 2) {
        runOnJS(handleDismiss)();
      } else {
        runOnJS(openAnimation.start)();
      }
    });

  return (
    <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
      <Modal onRequestClose={onClose} transparent visible={visible}>
        <TouchableWithoutFeedback onPress={onClose} style={{ flex: 1 }}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <GestureDetector gesture={gesture}>
              <View style={[styles.overlay, { backgroundColor: overlay }, overlayTheme]}>
                <Animated.View
                  style={[
                    styles.container,
                    {
                      backgroundColor: white_snow,
                      height,
                      transform: [{ translateY }],
                    },
                    container,
                  ]}
                >
                  <View
                    style={[
                      styles.handle,
                      { backgroundColor: grey, width: windowWidth / 4 },
                      handle,
                    ]}
                  />
                  <View style={[styles.contentContainer, contentContainer]}>{children}</View>
                </Animated.View>
              </View>
            </GestureDetector>
          </GestureHandlerRootView>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  content: {
    flex: 1,
    padding: 16,
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
});
