import React, { useEffect, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  EmitterSubscription,
  Keyboard,
  KeyboardAvoidingViewProps,
  KeyboardEvent,
  KeyboardEventListener,
  LayoutAnimation,
  LayoutChangeEvent,
  LayoutRectangle,
  Platform,
  ScreenRect,
  StyleSheet,
  View,
} from 'react-native';

import { KeyboardProvider } from '../../contexts/keyboardContext/KeyboardContext';

/**
 * View that moves out of the way when the keyboard appears by automatically
 * adjusting its height, position, or bottom padding.
 *
 * Following piece of code has been mostly copied from KeyboardAvoidingView component, with few additional tweaks.
 */
export const KeyboardCompatibleView: React.FC<KeyboardAvoidingViewProps> = ({
  behavior = Platform.OS === 'ios' ? 'padding' : 'position',
  children,
  contentContainerStyle,
  enabled = true,
  keyboardVerticalOffset = Platform.OS === 'ios' ? 86.5 : -300,
  style,
  ...props
}) => {
  const frame = useRef<LayoutRectangle>();
  const initialFrameHeight = useRef(0);
  const keyboardEvent = useRef<KeyboardEvent>();
  const subscriptions = useRef<EmitterSubscription[]>([]);
  const viewRef = useRef<View | null>(null);

  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [bottom, setBottom] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        setKeyboardListeners();
      }

      if (nextAppState.match(/inactive|background/)) {
        unsetKeyboardListeners();
      }

      setAppState(nextAppState);
    };

    const onKeyboardChange: KeyboardEventListener = (event) => {
      keyboardEvent.current = event;
    };

    const setKeyboardListeners = () => {
      if (Platform.OS === 'ios') {
        subscriptions.current = [
          Keyboard.addListener('keyboardWillChangeFrame', onKeyboardChange),
          Keyboard.addListener('keyboardDidHide', () => {
            setIsKeyboardOpen(false);
          }),
          Keyboard.addListener('keyboardDidShow', () => {
            setIsKeyboardOpen(true);
          }),
        ];
      } else {
        subscriptions.current = [
          Keyboard.addListener('keyboardDidHide', (event) => {
            onKeyboardChange(event);
            setIsKeyboardOpen(false);
          }),
          Keyboard.addListener('keyboardDidShow', (event) => {
            onKeyboardChange(event);
            setIsKeyboardOpen(true);
          }),
        ];
      }
    };

    const unsetKeyboardListeners = () => {
      subscriptions.current = subscriptions.current.filter((subscription) => {
        subscription.remove();
        return false;
      });
    };

    AppState.addEventListener('change', handleAppStateChange);
    setKeyboardListeners();

    return () => {
      AppState.removeEventListener('change', handleAppStateChange);
      unsetKeyboardListeners();
    };
  }, []);

  useEffect(() => {
    updateBottomIfNecessary();
  }, [keyboardEvent.current]);

  const dismissKeyboard: () => Promise<void> | undefined = () => {
    if (!isKeyboardOpen) {
      return;
    }

    return new Promise((resolve) => {
      const subscription = Keyboard.addListener('keyboardDidHide', () => {
        resolve();
        subscription.remove();
      });

      Keyboard.dismiss();
    });
  };

  const onLayout: (event: LayoutChangeEvent) => void = (event) => {
    frame.current = event.nativeEvent.layout;
    if (!initialFrameHeight.current) {
      // save the initial frame height, before the keyboard is visible
      initialFrameHeight.current = frame.current.height;
    }

    updateBottomIfNecessary();
  };

  const relativeKeyboardHeight = (keyboardFrame: ScreenRect) => {
    if (!frame.current || !keyboardFrame) {
      return 0;
    }

    const keyboardY = keyboardFrame.screenY - keyboardVerticalOffset;

    // Calculate the displacement needed for the view such that it
    // no longer overlaps with the keyboard
    return Math.max(frame.current.y + frame.current.height - keyboardY, 0);
  };

  const updateBottomIfNecessary = () => {
    if (!keyboardEvent.current) {
      setBottom(0);
      return;
    }

    const { duration, easing, endCoordinates } = keyboardEvent.current;
    const height = relativeKeyboardHeight(endCoordinates);

    if (bottom === height) {
      return;
    }

    if (duration && easing) {
      LayoutAnimation.configureNext({
        // We have to pass the duration equal to minimal accepted duration defined here: RCTLayoutAnimation.m
        duration: duration > 10 ? duration : 10,
        update: {
          duration: duration > 10 ? duration : 10,
          type: LayoutAnimation.Types[easing] || 'keyboard',
        },
      });
    }
    setBottom(height);
  };

  const bottomHeight = enabled ? bottom : 0;
  switch (behavior) {
    case 'height':
      // eslint-disable-next-line no-case-declarations
      let heightStyle;
      if (frame.current && bottom > 0) {
        // Note that we only apply a height change when there is keyboard present,
        // i.e. this.state.bottom is greater than 0. If we remove that condition,
        // this.frame.height will never go back to its original value.
        // When height changes, we need to disable flex.
        heightStyle = {
          flex: 0,
          height: initialFrameHeight.current - bottomHeight,
        };
      }
      return (
        <KeyboardProvider value={{ dismissKeyboard }}>
          <View
            onLayout={onLayout}
            ref={viewRef}
            style={StyleSheet.compose(style, heightStyle)}
            {...props}
          >
            {children}
          </View>
        </KeyboardProvider>
      );

    case 'position':
      return (
        <KeyboardProvider value={{ dismissKeyboard }}>
          <View onLayout={onLayout} ref={viewRef} style={style} {...props}>
            <View
              style={StyleSheet.compose(contentContainerStyle, {
                bottom: bottomHeight,
              })}
            >
              {children}
            </View>
          </View>
        </KeyboardProvider>
      );

    case 'padding':
      return (
        <KeyboardProvider value={{ dismissKeyboard }}>
          <View
            onLayout={onLayout}
            ref={viewRef}
            style={StyleSheet.compose(style, { paddingBottom: bottomHeight })}
            {...props}
          >
            {children}
          </View>
        </KeyboardProvider>
      );

    default:
      return (
        <KeyboardProvider value={{ dismissKeyboard }}>
          <View onLayout={onLayout} ref={viewRef} style={style} {...props}>
            {children}
          </View>
        </KeyboardProvider>
      );
  }
};
