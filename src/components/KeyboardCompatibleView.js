import React from 'react';
import { Platform, View, Keyboard, Animated, Dimensions } from 'react-native';
import { KeyboardContext } from '../context';

export class KeyboardCompatibleView extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      channelHeight: new Animated.Value('100%'),
    };

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

    this._keyboardOpen = false;
    // Following variable takes care of race condition between keyboardDidHide and keyboardDidShow.
    this._hidingKeyboardInProgress = false;
    this.rootChannelView = false;
    this.initialHeight = undefined;
  }

  componentWillUnmount() {
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
  }

  // TODO: Better to extract following functions to different HOC.
  keyboardDidShow = (e) => {
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
        console.log(
          'Aborting keyboardDidShow operation since hide is in progress!',
        );
        return;
      }

      const { height: windowHeight } = Dimensions.get('window');

      Animated.timing(this.state.channelHeight, {
        toValue: windowHeight - y - keyboardHeight,
        duration: 500,
      }).start(() => {
        // Force the final value, in case animation halted in between.
        this.state.channelHeight.setValue(windowHeight - y - keyboardHeight);
      });
    });
    this._keyboardOpen = true;
  };

  keyboardDidHide = () => {
    this._hidingKeyboardInProgress = true;
    Animated.timing(this.state.channelHeight, {
      toValue: this.initialHeight,
      duration: 500,
    }).start(() => {
      // Force the final value, in case animation halted in between.
      this.state.channelHeight.setValue(this.initialHeight);
      this._hidingKeyboardInProgress = false;
      this._keyboardOpen = false;
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
        duration: 500,
      }).start((response) => {
        this.state.channelHeight.setValue(this.initialHeight);
        if (response && !response.finished) {
          // If by some chance animation didn't go smooth or had some issue,
          // then simply defer promise resolution until after 500 ms.
          // This is the time we perform animation for adjusting animation of Channel component height
          // during keyboard dismissal.
          setTimeout(() => {
            resolve();
          }, 500);
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
    await this.keyboardWillDismiss();
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
