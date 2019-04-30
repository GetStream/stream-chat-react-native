import React, { PureComponent } from 'react';
import { TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';

import { buildStylesheet } from '../styles/styles';

export class MessageNotification extends PureComponent {
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

  render() {
    const styles = buildStylesheet('MessageNotification', this.props.style);
    if (!this.props.showNotification) {
      return null;
    } else {
      return (
        <TouchableOpacity
          onPress={this.props.onClick}
          style={styles.container}
          onClick={this.props.onClick}
        >
          {this.props.children}
        </TouchableOpacity>
      );
    }
  }
}
