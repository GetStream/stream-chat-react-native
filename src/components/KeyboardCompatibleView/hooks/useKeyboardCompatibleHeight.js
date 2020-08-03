import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Keyboard, Platform, StatusBar } from 'react-native';

import { useAppState } from './useAppState';

export const useKeyboardCompatibleHeight = ({
  enabled,
  initialHeight,
  rootChannelView,
}) => {
  const appState = useAppState();

  const hidingKeyboardInProgress = useRef(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const [height, setHeight] = useState(initialHeight);

  const keyboardDidShow = useCallback(
    (e) => {
      if (!enabled) {
        return;
      }

      const keyboardHidingInProgressBeforeMeasure =
        hidingKeyboardInProgress.current;
      const keyboardHeight = e.endCoordinates.height;

      if (rootChannelView) {
        rootChannelView.current.measureInWindow((x, y) => {
          // In case if keyboard was closed in meanwhile while
          // this measure function was being executed, then we
          // should abort further execution and let the event callback
          // keyboardDidHide proceed.
          if (
            !keyboardHidingInProgressBeforeMeasure &&
            hidingKeyboardInProgress.current
          ) {
            return;
          }

          const { height: windowHeight } = Dimensions.get('window');
          let finalHeight;

          if (Platform.OS === 'android') {
            finalHeight =
              windowHeight - y - keyboardHeight - StatusBar.currentHeight;
          } else {
            finalHeight = windowHeight - y - keyboardHeight;
          }

          setHeight(finalHeight);
          setKeyboardOpen(true);
        });
      }
    },
    [enabled, hidingKeyboardInProgress, rootChannelView, setHeight],
  );

  const keyboardDidHide = useCallback(() => {
    hidingKeyboardInProgress.current = true;
    setHeight(initialHeight);
    setKeyboardOpen(false);
  }, [hidingKeyboardInProgress, initialHeight, setHeight]);

  useEffect(() => {
    if (appState === 'active') {
      if (Platform.OS === 'ios') {
        Keyboard.addListener('keyboardWillShow', keyboardDidShow);
      } else {
        // Android doesn't support keyboardWillShow event.
        Keyboard.addListener('keyboardDidShow', keyboardDidShow);
      }

      // We dismiss the keyboard manually (along with keyboardWillHide function) when message is touched.
      // Following listener is just for a case when keyboard gets dismissed due to something besides message touch.
      Keyboard.addListener('keyboardDidHide', keyboardDidHide);
    }

    return () => {
      if (Platform.OS === 'ios') {
        Keyboard.removeListener('keyboardWillShow', keyboardDidShow);
      } else {
        Keyboard.removeListener('keyboardDidShow', keyboardDidShow);
      }
      Keyboard.removeListener('keyboardDidHide', keyboardDidHide);
    };
  }, [appState, initialHeight, keyboardDidHide, keyboardDidShow]);

  return [height, keyboardOpen];
};
