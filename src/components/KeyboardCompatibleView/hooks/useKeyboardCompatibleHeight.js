import { useEffect, useState } from 'react';
import { Keyboard, Platform, Dimensions, StatusBar } from 'react-native';
import { useAppState } from './useAppState';

export const useKeyboardCompatibleHeight = (
  rootChannelView,
  initialHeight,
  enabled,
) => {
  const appStateVisible = useAppState();
  let hidingKeyboardInProgress = false;
  const [height, setHeight] = useState(initialHeight);
  const keyboardDidShow = (e) => {
    if (!enabled) return;
    const keyboardHidingInProgressBeforeMeasure = hidingKeyboardInProgress;
    const keyboardHeight = e.endCoordinates.height;

    if (rootChannelView) {
      rootChannelView.current.measureInWindow((x, y) => {
        // In case if keyboard was closed in meanwhile while
        // this measure function was being executed, then we
        // should abort further execution and let the event callback
        // keyboardDidHide proceed.
        if (
          !keyboardHidingInProgressBeforeMeasure &&
          hidingKeyboardInProgress
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
          console.r.log(windowHeight, y, keyboardHeight);
        }

        console.r.log('keyboardDidShow - ', finalHeight);
        setHeight(finalHeight);
      });
    }
  };

  const keyboardDidHide = () => {
    hidingKeyboardInProgress = true;
    setHeight(initialHeight);
  };

  useEffect(() => {
    if (appStateVisible) {
      if (Platform.OS === 'ios') {
        Keyboard.addListener('keyboardWillShow', keyboardDidShow);
      } else {
        // Android doesn't support keyboardWillShow event.
        Keyboard.addListener('keyboardDidShow', keyboardDidShow);
      }

      // We dismiss the keyboard manually (along with keyboardWillHide function) when message is touched.
      // Following listener is just for a case when keyboard gets dismissed due to something besides message touch.
      Keyboard.addListener('keyboardDidHide', keyboardDidHide);

      return () => {
        Keyboard.removeListener('keyboardWillShow', keyboardDidShow);
        Keyboard.removeListener('keyboardDidShow', keyboardDidShow);
        Keyboard.removeListener('keyboardDidHide', keyboardDidHide);
      };
    }
  }, [initialHeight, appStateVisible]);

  return height;
};
