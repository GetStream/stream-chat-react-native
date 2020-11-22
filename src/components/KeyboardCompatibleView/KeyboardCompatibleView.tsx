import React from 'react';
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
export class KeyboardCompatibleView extends React.Component<
  KeyboardAvoidingViewProps,
  { appState: AppStateStatus; bottom: number; isKeyboardOpen: boolean }
> {
  static defaultProps: Pick<
    KeyboardAvoidingViewProps,
    'behavior' | 'enabled' | 'keyboardVerticalOffset'
  > = {
    behavior: Platform.OS === 'ios' ? 'padding' : 'position',
    enabled: true,
    keyboardVerticalOffset: Platform.OS === 'ios' ? 86.5 : -300, // default MessageInput height
  };

  _frame: LayoutRectangle | null = null;
  _keyboardEvent: KeyboardEvent | null = null;
  _subscriptions: EmitterSubscription[] = [];
  viewRef: React.RefObject<View>;
  _initialFrameHeight = 0;
  constructor(props: KeyboardAvoidingViewProps) {
    super(props);
    this.state = {
      appState: AppState.currentState,
      bottom: 0,
      isKeyboardOpen: false,
    };
    this.viewRef = React.createRef();
  }

  _relativeKeyboardHeight(keyboardFrame: ScreenRect) {
    const frame = this._frame;
    if (!frame || !keyboardFrame) {
      return 0;
    }

    const keyboardY =
      keyboardFrame.screenY - (this.props.keyboardVerticalOffset as number);

    // Calculate the displacement needed for the view such that it
    // no longer overlaps with the keyboard
    return Math.max(frame.y + frame.height - keyboardY, 0);
  }

  _onKeyboardChange: KeyboardEventListener = (event) => {
    this._keyboardEvent = event;
    this._updateBottomIfNecessary();
  };

  _onLayout: (event: LayoutChangeEvent) => void = (event) => {
    this._frame = event.nativeEvent.layout;
    if (!this._initialFrameHeight) {
      // save the initial frame height, before the keyboard is visible
      this._initialFrameHeight = this._frame.height;
    }

    this._updateBottomIfNecessary();
  };

  _updateBottomIfNecessary = () => {
    if (this._keyboardEvent === null) {
      this.setState({ bottom: 0 });
      return;
    }

    const { duration, easing, endCoordinates } = this._keyboardEvent;
    const height = this._relativeKeyboardHeight(endCoordinates);

    if (this.state.bottom === height) {
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
    this.setState({ bottom: height });
  };

  _handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      this.state.appState.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      this.setKeyboardListeners();
    }

    if (nextAppState.match(/inactive|background/)) {
      this.unsetKeyboardListeners();
    }

    this.setState({ appState: nextAppState });
  };

  setKeyboardListeners = () => {
    if (Platform.OS === 'ios') {
      this._subscriptions = [
        Keyboard.addListener('keyboardWillChangeFrame', this._onKeyboardChange),
      ];
    } else {
      this._subscriptions = [
        Keyboard.addListener('keyboardDidHide', this._onKeyboardChange),
        Keyboard.addListener('keyboardDidShow', this._onKeyboardChange),
      ];
    }

    this._subscriptions.push(
      Keyboard.addListener('keyboardDidHide', () => {
        this.setState({ isKeyboardOpen: false });
      }),
      Keyboard.addListener('keyboardDidShow', () => {
        this.setState({ isKeyboardOpen: true });
      }),
    );
  };

  unsetKeyboardListeners = () => {
    this._subscriptions = this._subscriptions.filter((subscription) => {
      subscription.remove();
      return false;
    });
  };

  dismissKeyboard: () => Promise<void> | undefined = () => {
    if (!this.state.isKeyboardOpen) {
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

  componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange);
    this.setKeyboardListeners();
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange);
    this.unsetKeyboardListeners();
  }

  render() {
    const {
      behavior,
      children,
      contentContainerStyle,
      enabled,
      style,
      ...props
    } = this.props;
    const bottomHeight = enabled ? this.state.bottom : 0;
    switch (behavior) {
      case 'height':
        // eslint-disable-next-line no-case-declarations
        let heightStyle;
        if (this._frame !== null && this.state.bottom > 0) {
          // Note that we only apply a height change when there is keyboard present,
          // i.e. this.state.bottom is greater than 0. If we remove that condition,
          // this.frame.height will never go back to its original value.
          // When height changes, we need to disable flex.
          heightStyle = {
            flex: 0,
            height: this._initialFrameHeight - bottomHeight,
          };
        }
        return (
          <KeyboardProvider value={{ dismissKeyboard: this.dismissKeyboard }}>
            <View
              onLayout={this._onLayout}
              ref={this.viewRef}
              style={StyleSheet.compose(style, heightStyle)}
              {...props}
            >
              {children}
            </View>
          </KeyboardProvider>
        );

      case 'position':
        return (
          <KeyboardProvider value={{ dismissKeyboard: this.dismissKeyboard }}>
            <View
              onLayout={this._onLayout}
              ref={this.viewRef}
              style={style}
              {...props}
            >
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
          <KeyboardProvider value={{ dismissKeyboard: this.dismissKeyboard }}>
            <View
              onLayout={this._onLayout}
              ref={this.viewRef}
              style={StyleSheet.compose(style, { paddingBottom: bottomHeight })}
              {...props}
            >
              {children}
            </View>
          </KeyboardProvider>
        );

      default:
        return (
          <KeyboardProvider value={{ dismissKeyboard: this.dismissKeyboard }}>
            <View
              onLayout={this._onLayout}
              ref={this.viewRef}
              style={style}
              {...props}
            >
              {children}
            </View>
          </KeyboardProvider>
        );
    }
  }
}
