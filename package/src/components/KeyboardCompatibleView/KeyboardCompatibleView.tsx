import React from 'react';
import {
  AccessibilityInfo,
  AppState,
  AppStateStatus,
  Dimensions,
  EmitterSubscription,
  Keyboard,
  KeyboardAvoidingViewProps,
  KeyboardEvent,
  KeyboardMetrics,
  LayoutAnimation,
  LayoutChangeEvent,
  LayoutRectangle,
  NativeEventSubscription,
  Platform,
  StatusBar,
  StyleSheet,
  TurboModuleRegistry,
  View,
} from 'react-native';

import { KeyboardProvider } from '../../contexts/keyboardContext/KeyboardContext';
import type { KeyboardEventListener, ViewRef } from '../../types/react-native-compat';

export type KeyboardCompatibleViewProps = KeyboardAvoidingViewProps;

export const dismissKeyboard = () => {
  Keyboard.dismiss();
};

/**
 * Whether the app runs edge-to-edge on Android (drawing behind the system bars). React Native
 * exposes this as a `DeviceInfo` native constant. It's a static, app-level value, so we read it
 * once and cache it. Defaults to `false` if the constant is unavailable (older RN / iOS).
 *
 * We need it to decide whether the OS resizes the window when the soft keyboard opens:
 * edge-to-edge apps do NOT resize (RN dispatches insets instead), non edge-to-edge apps use
 * `adjustResize` and the window shrinks. `Dimensions.screen - Dimensions.window` alone cannot
 * tell them apart, because on API < 35 the bars are reported as an inset in BOTH cases.
 */
let cachedIsEdgeToEdge: boolean | undefined;
const getIsEdgeToEdge = (): boolean => {
  if (cachedIsEdgeToEdge === undefined) {
    cachedIsEdgeToEdge = false;
    if (Platform.OS === 'android') {
      try {
        const deviceInfo = TurboModuleRegistry.get('DeviceInfo') as {
          getConstants?: () => { isEdgeToEdge?: boolean };
        } | null;
        cachedIsEdgeToEdge = deviceInfo?.getConstants?.().isEdgeToEdge ?? false;
      } catch {
        cachedIsEdgeToEdge = false;
      }
    }
  }
  return cachedIsEdgeToEdge;
};

type State = {
  bottom: number;
};

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
    behavior: 'padding',
    enabled: true,
    keyboardVerticalOffset: Platform.OS === 'ios' ? 86.5 : -300, // default MessageComposer height
  };

  _frame: LayoutRectangle | null = null;
  _keyboardEvent: KeyboardEvent | null = null;
  _subscriptions: EmitterSubscription[] = [];
  _appStateSubscription: NativeEventSubscription | null = null;
  viewRef: React.RefObject<ViewRef | null>;
  _initialFrameHeight = 0;
  _bottom: number = 0;

  constructor(props: KeyboardAvoidingViewProps) {
    super(props);
    this.state = {
      appState: (AppState.currentState as AppStateStatus | null | undefined) ?? 'unknown',
      bottom: 0,
      isKeyboardOpen: false,
    };
    this.viewRef = React.createRef();
  }

  async _relativeKeyboardHeight(keyboardFrame: KeyboardMetrics): Promise<number> {
    const frame = this._frame;
    if (!frame || !keyboardFrame) {
      return 0;
    }

    if (
      Platform.OS === 'ios' &&
      keyboardFrame.screenY === 0 &&
      (await AccessibilityInfo.prefersCrossFadeTransitions())
    ) {
      return 0;
    }

    const keyboardY = keyboardFrame.screenY - (this.props.keyboardVerticalOffset ?? 0);

    if (Platform.OS === 'android') {
      // On Android, whether we need a JS offset depends on whether the OS resizes the
      // window when the soft keyboard opens:
      //
      // - Non edge-to-edge apps use `adjustResize`: the OS shrinks the window and already
      //   keeps the composer above the keyboard, so no JS offset is needed. Applying one
      //   anyway double offsets the view and because our layout `frame` only reflects the
      //   resize a render AFTER `keyboardDidShow` fires, that offset is briefly computed
      //   from the stale, full height frame and stacked on top of the native resize. That
      //   manifests as a transient jump to a very high point that then settles, more commonly
      //   seen on devices such as Samsung on Android 13. So here we skip the JS offset entirely.
      //
      // - Edge-to-edge apps (the platform default on Android 15/API 35+ and optin below
      //   that) do NOT resize the window for the keyboard, so the JS offset below is the only
      //   thing keeping the composer visible and must be applied.
      //
      // `screen - window` reflects the system bar inset, which is present on non edge-to-edge
      // AND on edge-to-edge below API 35, so it can't distinguish the two on its own. We pair
      // it with the `isEdgeToEdge` native flag: only skip the offset when the bars are inset
      // (there is room for `adjustResize` to shrink into) AND the app is not edge-to-edge.
      const systemBarsInset = Dimensions.get('screen').height - Dimensions.get('window').height;
      if (systemBarsInset > 0 && !getIsEdgeToEdge()) {
        return 0;
      }
    }

    if (this.props.behavior === 'height') {
      return Math.max(this.state.bottom + frame.y + frame.height - keyboardY, 0);
    }

    // Calculate the displacement needed for the view such that it
    // no longer overlaps with the keyboard
    const relativeHeight = Math.max(frame.y + frame.height - keyboardY, 0);

    if (Platform.OS === 'android') {
      // Edge-to-edge only reaches here (systemBarsInset === 0 above): guard against
      // sub status bar noise so we don't apply a tiny bogus offset.
      const systemInsetFloor = StatusBar.currentHeight ?? 0;
      if (relativeHeight <= systemInsetFloor) {
        return 0;
      }
    }

    return relativeHeight;
  }

  _onKeyboardChange: KeyboardEventListener = (event) => {
    this._keyboardEvent = event;
    this._updateBottomIfNecessary();
  };

  _onKeyboardHide: KeyboardEventListener = () => {
    this._keyboardEvent = null;
    this._updateBottomIfNecessary();
  };

  _onLayout: (event: LayoutChangeEvent) => void = async (event) => {
    event.persist();

    const oldFrame = this._frame;
    this._frame = event.nativeEvent.layout;
    if (!this._initialFrameHeight) {
      // save the initial frame height, before the keyboard is visible
      this._initialFrameHeight = this._frame.height;
    }

    // update bottom height for the first time or when the height is changed
    if (!oldFrame || oldFrame.height !== this._frame.height) {
      await this._updateBottomIfNecessary();
    }

    if (this.props.onLayout) {
      this.props.onLayout(event);
    }
  };

  // Avoid unnecessary renders if the KeyboardAvoidingView is disabled.
  _setBottom = (value: number) => {
    const enabled = this.props.enabled ?? true;
    this._bottom = value;
    if (enabled) {
      this.setState({ bottom: value });
    }
  };

  _updateBottomIfNecessary = async () => {
    if (this._keyboardEvent == null) {
      this._setBottom(0);
      return;
    }

    const { duration, easing, endCoordinates } = this._keyboardEvent;
    const height = await this._relativeKeyboardHeight(endCoordinates);

    if (this._bottom === height) {
      return;
    }

    this._setBottom(height);

    const enabled = this.props.enabled ?? true;
    if (enabled && duration && easing) {
      LayoutAnimation.configureNext({
        // We have to pass the duration equal to minimal accepted duration defined here: RCTLayoutAnimation.m
        duration: duration > 10 ? duration : 10,
        update: {
          duration: duration > 10 ? duration : 10,
          type: LayoutAnimation.Types[easing] || 'keyboard',
        },
      });
    }
  };

  _handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
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
        Keyboard.addListener('keyboardWillHide', this._onKeyboardHide),
        Keyboard.addListener('keyboardWillShow', this._onKeyboardChange),
      ];
    } else {
      this._subscriptions = [
        Keyboard.addListener('keyboardDidHide', this._onKeyboardHide),
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

  componentDidUpdate(_: KeyboardAvoidingViewProps, prevState: State): void {
    const enabled = this.props.enabled ?? true;
    if (enabled && this._bottom !== prevState.bottom) {
      this.setState({ bottom: this._bottom });
    }
  }

  componentDidMount() {
    if (!Keyboard.isVisible()) {
      this._keyboardEvent = null;
      this._setBottom(0);
    }

    this._appStateSubscription = AppState.addEventListener('change', this._handleAppStateChange);
    this.setKeyboardListeners();
  }

  componentWillUnmount() {
    // Following if-else condition to avoid deprecated warning coming RN 0.65
    if (this._appStateSubscription?.remove) {
      this._appStateSubscription?.remove();
    }
    // @ts-ignore
    else if (AppState.removeEventListener) {
      // @ts-ignore
      AppState.removeEventListener('change', this._handleAppStateChange);
    }
    this.unsetKeyboardListeners();
  }

  keyboardContextValue = { dismissKeyboard: this.dismissKeyboard };

  render() {
    const { behavior, children, contentContainerStyle, enabled, style, ...props } = this.props;
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
          <KeyboardProvider value={this.keyboardContextValue}>
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
          <KeyboardProvider value={this.keyboardContextValue}>
            <View onLayout={this._onLayout} ref={this.viewRef} style={style} {...props}>
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
          <KeyboardProvider value={this.keyboardContextValue}>
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
          <KeyboardProvider value={this.keyboardContextValue}>
            <View onLayout={this._onLayout} ref={this.viewRef} style={style} {...props}>
              {children}
            </View>
          </KeyboardProvider>
        );
    }
  }
}
