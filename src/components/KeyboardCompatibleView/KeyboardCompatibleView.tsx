import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Keyboard, LayoutChangeEvent, View } from 'react-native';

import { useKeyboardCompatibleHeight } from './hooks/useKeyboardCompatibleHeight';

import { KeyboardContext } from '../../context';

/**
 * KeyboardCompatibleView is HOC component similar to [KeyboardAvoidingView](https://facebook.github.io/react-native/docs/keyboardavoidingview),
 * designed to work with MessageInput and MessageList component.
 *
 * Main motivation of writing our own component was to get rid of issues that come with KeyboardAvoidingView from react-native
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

type Props = {
  enabled?: boolean;
  keyboardDismissAnimationDuration?: number;
  keyboardOpenAnimationDuration?: number;
};

export const KeyboardCompatibleView: React.FC<Props> = ({
  children,
  enabled = true,
  keyboardDismissAnimationDuration = 500,
  keyboardOpenAnimationDuration = 500,
}) => {
  const heightAnim = useRef(new Animated.Value(0)).current;
  const rootChannelView = useRef<View>(null);

  const [initialHeight, setInitialHeight] = useState(0);

  const {
    height: channelHeight,
    keyboardOpen: isKeyboardOpen,
  } = useKeyboardCompatibleHeight({
    enabled,
    initialHeight,
    rootChannelView,
  });

  useEffect(() => {
    Animated.timing(heightAnim, {
      duration: isKeyboardOpen
        ? keyboardDismissAnimationDuration
        : keyboardOpenAnimationDuration,
      toValue: channelHeight,
      useNativeDriver: false,
    }).start();
  }, [
    channelHeight,
    heightAnim,
    isKeyboardOpen,
    keyboardDismissAnimationDuration,
    keyboardOpenAnimationDuration,
  ]);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();

    return new Promise((resolve) => {
      if (!isKeyboardOpen) {
        // If channel height is already at full length, then don't do anything.
        resolve();
      } else {
        // Bring the channel height to its full length state.
        Animated.timing(heightAnim, {
          duration: keyboardDismissAnimationDuration,
          toValue: initialHeight,
          useNativeDriver: false,
        }).start(resolve);
      }
    });
  }, [
    heightAnim,
    initialHeight,
    isKeyboardOpen,
    keyboardDismissAnimationDuration,
  ]);

  const onLayout: (event: LayoutChangeEvent) => void = useCallback(
    ({
      nativeEvent: {
        layout: { height },
      },
    }) => {
      if (!enabled) {
        return;
      }

      // Not to set initial height again.
      if (!initialHeight) {
        setInitialHeight(height);
        Animated.timing(heightAnim, {
          duration: 10,
          toValue: height,
          useNativeDriver: false,
        }).start();
      }
    },
    [enabled, heightAnim, initialHeight],
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
    <Animated.View
      onLayout={onLayout}
      style={{
        height: initialHeight ? heightAnim : undefined,
      }}
    >
      <KeyboardContext.Provider value={{ dismissKeyboard }}>
        <View collapsable={false} ref={rootChannelView}>
          {children}
        </View>
      </KeyboardContext.Provider>
    </Animated.View>
  );
};

export default KeyboardCompatibleView;
