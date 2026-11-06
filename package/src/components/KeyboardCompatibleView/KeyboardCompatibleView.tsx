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
 * Whether the app runs edge-to-edge on Android, read once from the `DeviceInfo` native constant and
 * cached. `false` on iOS or when the constant is unavailable.
 *
 * Edge-to-edge apps do not resize the window when the keyboard opens, others do (`adjustResize`).
 * `Dimensions.screen - Dimensions.window` cannot tell them apart: below API 35 the bars are an
 * inset in both cases.
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
 * View that moves out of the way when the keyboard appears by adjusting its height, position, or
 * bottom padding. Adapted from React Native's `KeyboardAvoidingView`.
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
    keyboardVerticalOffset: Platform.OS === 'ios' ? 86.5 : -300, // Default MessageComposer height.
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
      // Without edge-to-edge the OS resizes the window (`adjustResize`) and already keeps the
      // composer above the keyboard, so no JS offset is applied. The layout `frame` only reflects
      // the resize a render after `keyboardDidShow`, so an offset would be computed from the stale
      // full-height frame and stack on the native resize, causing a transient jump (seen on
      // Samsung, Android 13). Edge-to-edge apps (the default from API 35) do not resize, so the JS
      // offset is required.
      // `screen - window` is the system bar inset, present in both modes below API 35, so it is
      // paired with `isEdgeToEdge`: the offset is skipped only when the bars are inset and the app
      // is not edge-to-edge.
      const systemBarsInset = Dimensions.get('screen').height - Dimensions.get('window').height;
      if (systemBarsInset > 0 && !getIsEdgeToEdge()) {
        return 0;
      }
    }

    if (this.props.behavior === 'height') {
      return Math.max(this.state.bottom + frame.y + frame.height - keyboardY, 0);
    }

    // Displacement needed to keep the view clear of the keyboard.
    const relativeHeight = Math.max(frame.y + frame.height - keyboardY, 0);

    if (Platform.OS === 'android') {
      // Offsets at or below the status bar height are noise, not a keyboard overlap.
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
      // Initial frame height, captured before the keyboard is visible.
      this._initialFrameHeight = this._frame.height;
    }

    // Recompute on the first layout and whenever the height changes.
    if (!oldFrame || oldFrame.height !== this._frame.height) {
      await this._updateBottomIfNecessary();
    }

    if (this.props.onLayout) {
      this.props.onLayout(event);
    }
  };

  // No state update when disabled, to avoid unnecessary renders.
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

    const { endCoordinates } = this._keyboardEvent;
    const height = await this._relativeKeyboardHeight(endCoordinates);

    if (this._bottom === height) {
      return;
    }

    this._setBottom(height);
  };

  _handleAppStateChange = (nextAppState: AppStateStatus) => {
    // `inactive` is visible-but-unfocused (Split View), so it must not tear down the listeners.
    // Mirrors `useAppStateListener`.
    if (this.state.appState === 'background' && nextAppState === 'active') {
      this.setKeyboardListeners();
    }

    if (nextAppState === 'background') {
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
    // `removeEventListener` fallback for RN versions whose subscription has no `remove()`.
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
          // Applied only while the keyboard is present (`state.bottom > 0`), otherwise
          // `frame.height` never returns to its original value. Flex is disabled so the height
          // wins.
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
