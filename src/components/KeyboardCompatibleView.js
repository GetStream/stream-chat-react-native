import React from 'react';
import {
  Platform,
  View,
  Keyboard,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { KeyboardContext } from '../context';
import PropTypes from 'prop-types';

/**
 * KeyboardCompatibleView is HOC component similar to [KeyboardAvoidingView](https://facebook.github.io/react-native/docs/keyboardavoidingview),
 * designed to work with MessageInput and MessageList component.
 *
 * Main motivation of writing this our own component was to get rid of issues that come with KeyboardAvoidingView from react-native
 * when used with components of fixed height. [Channel](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/ChannelInner.js) component
 * uses `KeyboardCompatibleView` internally, so you don't need to explicitely add it.
 *
 * ```json
 * <KeyboardCompatibleView>
 *  <MessageList />
 *  <MessageInput />
 * </KeyboardCompatibleView>
 * ```
 */
export class KeyboardCompatibleView extends React.PureComponent {
  static propTypes = {
    keyboardDismissAnimationDuration: PropTypes.number,
    keyboardOpenAnimationDuration: PropTypes.number,
    enabled: PropTypes.bool,
  };
  static defaultProps = {
    keyboardDismissAnimationDuration: 500,
    keyboardOpenAnimationDuration: 500,
    enabled: true,
  };

  constructor(props) {
    super(props);

    this.state = {
      channelHeight: new Animated.Value('100%'),
      // For some reason UI doesn't update sometimes, when state is updated using setValue.
      // So to force update the component, I am using following key, which will be increamented
      // for every keyboard slide up and down.
      key: 0,
    };

    this.setupListeners();

    this._keyboardOpen = false;
    // Following variable takes care of race condition between keyboardDidHide and keyboardDidShow.
    this._hidingKeyboardInProgress = false;
    this.rootChannelView = false;
    this.initialHeight = undefined;
  }

  setupListeners = () => {
    if (!this.props.enabled) return;

    if (Platform.OS === 'ios') {
      this.keyboardDidShowListener = Keyboard.addListener(
        'keyboardWillShow',
        this.keyboardDidShow,
      );
    } else {
      // Android doesn't support keyboardWillShow event.
      this.keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        this.keyboardDidShow,
      );
    }

    // We dismiss the keyboard manually (along with keyboardWillHide function) when message is touched.
    // Following listener is just for a case when keyboard gets dismissed due to something besides message touch.
    this.keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      this.keyboardDidHide,
    );
  };
  componentWillUnmount() {
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
  }

  // TODO: Better to extract following functions to different HOC.
  keyboardDidShow = (e) => {
    if (!this.props.enabled) return;
    const keyboardHidingInProgressBeforeMeasure = this
      ._hidingKeyboardInProgress;
    const keyboardHeight = e.endCoordinates.height;

    this.rootChannelView.measureInWindow((x, y) => {
      // In case if keyboard was closed in meanwhile while
      // this measure function was being executed, then we
      // should abort further execution and let the event callback
      // keyboardDidHide proceed.
      if (
        !keyboardHidingInProgressBeforeMeasure &&
        this._hidingKeyboardInProgress
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

      Animated.timing(this.state.channelHeight, {
        toValue: finalHeight,
        duration: this.props.keyboardOpenAnimationDuration,
      }).start(() => {
        // Force the final value, in case animation halted in between.
        this.state.channelHeight.setValue(finalHeight);
        this.setState({
          key: this.state.key + 1,
        });
      });
    });
    this._keyboardOpen = true;
  };

  keyboardDidHide = () => {
    this._hidingKeyboardInProgress = true;
    Animated.timing(this.state.channelHeight, {
      toValue: this.initialHeight,
      duration: this.props.keyboardDismissAnimationDuration,
    }).start(() => {
      // Force the final value, in case animation halted in between.
      this.state.channelHeight.setValue(this.initialHeight);
      this._hidingKeyboardInProgress = false;
      this._keyboardOpen = false;
      this.setState({
        key: this.state.key + 1,
      });
    });
  };

  keyboardWillDismiss = () =>
    new Promise((resolve) => {
      if (!this._keyboardOpen) {
        resolve();
        return;
      }

      Animated.timing(this.state.channelHeight, {
        toValue: this.initialHeight,
        duration: this.props.keyboardDismissAnimationDuration,
      }).start((response) => {
        this.state.channelHeight.setValue(this.initialHeight);
        if (response && !response.finished) {
          // If by some chance animation didn't go smooth or had some issue,
          // then simply defer promise resolution until after 500 ms.
          // This is the time we perform animation for adjusting animation of Channel component height
          // during keyboard dismissal.
          setTimeout(() => {
            resolve();
          }, this.props.keyboardDismissAnimationDuration);
          return;
        }

        resolve();
      });
    });

  setRootChannelView = (o) => {
    this.rootChannelView = o;
  };

  onLayout = ({
    nativeEvent: {
      layout: { height },
    },
  }) => {
    // Not to set initial height again.
    if (!this.initialHeight) {
      this.initialHeight = height;
      this.state.channelHeight.setValue(this.initialHeight);
    }
  };

  dismissKeyboard = async () => {
    Keyboard.dismiss();
    if (this.props.enabled) await this.keyboardWillDismiss();
  };

  getContext = () => ({
    dismissKeyboard: this.dismissKeyboard,
  });

  render() {
    const height = this.initialHeight
      ? { height: this.state.channelHeight }
      : {};

    return (
      <Animated.View
        style={{ display: 'flex', ...height }}
        onLayout={this.onLayout}
      >
        <KeyboardContext.Provider value={this.getContext()}>
          <View ref={this.setRootChannelView} collapsable={false}>
            {this.props.children}
          </View>
        </KeyboardContext.Provider>
      </Animated.View>
    );
  }
}
