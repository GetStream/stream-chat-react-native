import React, { PropsWithChildren, useEffect, useRef } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardEvent,
  Modal,
  PanResponder,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

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
      colors: { grey, overlay, white_snow },
    },
  } = useTheme();

  const panY = useRef(new Animated.Value(windowHeight)).current;
  const resetPositionAnim = Animated.timing(panY, {
    duration: 300,
    toValue: 0,
    useNativeDriver: true,
  });

  const closeAnim = Animated.timing(panY, {
    duration: 300,
    toValue: height,
    useNativeDriver: true,
  });

  const translateY = panY.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0, 0, 1],
  });

  const handleDismiss = () => {
    closeAnim.start(() => onClose());
  };

  useEffect(() => {
    if (visible) {
      resetPositionAnim.start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const panResponders = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_event, gestureState) => {
        panY.setValue(Math.max(gestureState.dy, 0));
      },
      onPanResponderRelease: (_event, gestureState) => {
        if (gestureState.dy > windowHeight / 3) {
          handleDismiss();
        } else {
          resetPositionAnim.start();
        }
      },
      onStartShouldSetPanResponder: () => true,
    }),
  ).current;

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
    Animated.timing(panY, {
      duration: 250,
      toValue: -event.endCoordinates.height,
      useNativeDriver: true,
    }).start();
  };

  const keyboardDidHide = () => {
    Animated.timing(panY, {
      duration: 250,
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal animationType='fade' onRequestClose={handleDismiss} transparent visible={visible}>
      <View style={[styles.overlay, { backgroundColor: overlay }]}>
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: white_snow,
              height,
              transform: [{ translateY }],
            },
          ]}
          {...panResponders.panHandlers}
        >
          <View style={[styles.handle, { backgroundColor: grey, width: windowWidth / 4 }]} />
          {children}
        </Animated.View>
      </View>
    </Modal>
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
