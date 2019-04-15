import React, { PureComponent } from 'react';
import { View, Button, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';

export class MessageNotification extends PureComponent {
  static propTypes = {
    /** If we should show the notification or not */
    showNotification: PropTypes.bool,
    /** Onclick handler */
    onClick: PropTypes.func.isRequired,
  };

  static defaultProps = {
    showNotification: true,
  };

  render() {
    if (!this.props.showNotification) {
      return null;
    } else {
      return (
        <TouchableOpacity
          onPress={this.props.onClick}
          style={{
            zIndex: 10,
            marginBottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
          onClick={this.props.onClick}
        >
          {this.props.children}
        </TouchableOpacity>
      );
    }
  }
}
