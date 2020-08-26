import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  View,
  LayoutAnimation,
  Platform,
  StatusBar,
} from 'react-native';

import { KeyboardContext } from '../../context';
import { useAppState } from './hooks/useAppState';

/**
 * KeyboardCompatibleView is HOC component similar to [KeyboardAvoidingView](https://facebook.github.io/react-native/docs/keyboardavoidingview),
 * designed to work with MessageInput and MessageList component.
 *
 * Main motivation of writing this our own component was to get rid of issues that come with KeyboardAvoidingView from react-native
 * when used with components of fixed height. [Channel](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/ChannelInner.js) component
 * uses `KeyboardCompatibleView` internally, so you don't need to explicitly add it.
 *
 * ```json
 * <KeyboardCompatibleView>
 *  <MessageList />
 *  <MessageInput />
 * </KeyboardCompatibleView>
 * ```
 */
export const KeyboardCompatibleView = ({ children, enabled = true }) => {
  const appState = useAppState();
  const [channelHeight, setChannelHeight] = useState(0);

  const rootChannelView = useRef(null);
  const isKeyboardOpen = useRef(false);
  const initialHeight = useRef(0);

  useEffect(() => {
    const onKeyboardChange = (e) => {
      if (!enabled) {
        return;
      }

      if (e === null) {
        setChannelHeight(initialHeight.current);
        isKeyboardOpen.current = false;
        return;
      }

      const { endCoordinates } = e;
      let isOpening = true;

      if (Platform.OS === 'ios') {
        const { startCoordinates } = e;
        isOpening = endCoordinates.screenY < startCoordinates.screenY;
      }

      const keyboardY = endCoordinates.screenY;
      if (rootChannelView) {
        if (e.duration && e.easing) {
          LayoutAnimation.configureNext({
            // We have to pass the duration equal to minimal accepted duration defined here: RCTLayoutAnimation.m
            duration: e.duration > 10 ? e.duration : 10,
            update: {
              duration: e.duration > 10 ? e.duration : 10,
              type: LayoutAnimation.Types[e.easing] || 'keyboard',
            },
          });
        }
        rootChannelView.current.measureInWindow((x, y) => {
          if (Platform.OS === 'android') {
            setChannelHeight(
              isOpening
                ? keyboardY - y - StatusBar.currentHeight
                : initialHeight.current,
            );
          } else {
            setChannelHeight(isOpening ? keyboardY - y : initialHeight.current);
          }
          isKeyboardOpen.current = !!isOpening;
        });
      }
    };

    let subscriptions = [];
    if (appState === 'active' && enabled) {
      if (Platform.OS === 'ios') {
        subscriptions = [
          Keyboard.addListener('keyboardWillChangeFrame', onKeyboardChange),
        ];
      } else {
        subscriptions = [
          Keyboard.addListener('keyboardDidHide', onKeyboardChange),
          Keyboard.addListener('keyboardDidShow', onKeyboardChange),
        ];
      }
    }
    return () => {
      subscriptions.forEach((subscription) => {
        subscription.remove();
      });
    };
  }, [enabled, appState]);

  const dismissKeyboard = useCallback((callback) => {
    if (!isKeyboardOpen.current) {
      callback && callback();
    } else {
      if (callback) {
        const subscribe = Keyboard.addListener('keyboardDidHide', () => {
          callback();
          subscribe.remove();
        });
      }

      Keyboard.dismiss();
      isKeyboardOpen.current = false;
    }
  }, []);

  const onLayout = useCallback(
    ({
      nativeEvent: {
        layout: { height },
      },
    }) => {
      if (!enabled) {
        return;
      }

      // Not to set initial height again.
      if (!initialHeight.current) {
        initialHeight.current = height;
        setChannelHeight(height);
      }
    },
    [enabled],
  );

  if (!enabled) {
    return (
      <KeyboardContext.Provider
        value={{
          dismissKeyboard,
        }}
      >
        {children}
      </KeyboardContext.Provider>
    );
  }

  return (
    <View
      onLayout={onLayout}
      style={{
        height: initialHeight.current ? channelHeight : undefined,
      }}
    >
      <KeyboardContext.Provider value={{ dismissKeyboard }}>
        <View collapsable={false} ref={rootChannelView}>
          {children}
        </View>
      </KeyboardContext.Provider>
    </View>
  );
};

export default KeyboardCompatibleView;
