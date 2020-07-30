import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Keyboard, Animated } from 'react-native';

import { KeyboardContext } from '../../context';
import { useKeyboardCompatibleHeight } from './hooks/useKeyboardCompatibleHeight';

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
export const KeyboardCompatibleView = (props) => {
  const heightAnim = useRef(new Animated.Value(0)).current;
  const rootChannelView = useRef(null);
  const [initialHeight, setInitialHeight] = useState(0);
  const channelHeight = useKeyboardCompatibleHeight(
    rootChannelView,
    initialHeight,
    props.enabled,
  );

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
    Animated.timing(heightAnim, {
      toValue: initialHeight,
      duration: props.keyboardOpenAnimationDuration,
      useNativeDriver: false,
    }).start();
  }, [initialHeight]);

  const getContext = useCallback(
    () => ({
      dismissKeyboard,
    }),
    [initialHeight],
  );

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: channelHeight,
      duration: props.keyboardOpenAnimationDuration,
      useNativeDriver: false,
    }).start();
  }, [channelHeight]);

  const onLayout = ({
    nativeEvent: {
      layout: { height },
    },
  }) => {
    if (!props.enabled) return;

    // Not to set initial height again.
    if (!initialHeight) {
      setInitialHeight(height);
      Animated.timing(heightAnim, {
        toValue: height,
        duration: 10,
        useNativeDriver: false,
      }).start();
    }
  };

  if (!props.enabled) {
    return (
      <KeyboardContext.Provider
        value={{
          dismissKeyboard,
        }}
      >
        {props.children}
      </KeyboardContext.Provider>
    );
  }

  return (
    <Animated.View
      onLayout={onLayout}
      style={{
        display: 'flex',
        height: initialHeight ? heightAnim : undefined,
      }}
    >
      <KeyboardContext.Provider value={getContext()}>
        <View ref={rootChannelView} collapsable={false}>
          {props.children}
        </View>
      </KeyboardContext.Provider>
    </Animated.View>
  );
};

export default KeyboardCompatibleView;
