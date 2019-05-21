import React, { PureComponent } from 'react';
import { TouchableOpacity, Animated } from 'react-native';
import PropTypes from 'prop-types';

import { buildStylesheet } from '../styles/styles';

export class MessageNotification extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      notificationOpacity: new Animated.Value(0),
    };
  }
  static propTypes = {
    /** If we should show the notification or not */
    showNotification: PropTypes.bool,
    /** Onclick handler */
    onClick: PropTypes.func.isRequired,
    /** Style overrides */
    style: PropTypes.object,
  };

  static defaultProps = {
    showNotification: true,
  };

  componentDidMount() {
    Animated.timing(this.state.notificationOpacity, {
      toValue: this.props.showNotification ? 1 : 0,
      duration: 500,
    }).start();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.showNotification !== this.props.showNotification) {
      Animated.timing(this.state.notificationOpacity, {
        toValue: this.props.showNotification ? 1 : 0,
        duration: 500,
      }).start();
    }
  }

  render() {
    const styles = buildStylesheet('MessageNotification', this.props.style);
    return (
      <Animated.View
        style={{ ...styles.container, opacity: this.state.notificationOpacity }}
      >
        <TouchableOpacity
          onPress={this.props.onClick}
          onClick={this.props.onClick}
          style={{ backgroundColor: 'transparent' }}
        >
          {this.props.children}
        </TouchableOpacity>
      </Animated.View>
    );
  }
}
