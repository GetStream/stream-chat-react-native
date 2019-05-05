import React from 'react';
import { View, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import iconReload from '../images/reload1.png';
import PropTypes from 'prop-types';
import { ProgressIndicatorTypes } from '../utils';

export class WithProgressIndicator extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  static propTypes = {
    active: PropTypes.bool,
    type: PropTypes.oneOf([
      ProgressIndicatorTypes.IN_PROGRESS,
      ProgressIndicatorTypes.RETRY,
    ]),
    action: PropTypes.func,
  };

  render() {
    if (!this.props.active) {
      return <View>{this.props.children}</View>;
    }

    return (
      <TouchableOpacity onPress={this.props.action}>
        {this.props.children}
        <View
          style={{
            position: 'absolute',
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'black',
            opacity: 0.3,
          }}
        />
        <View
          style={{
            position: 'absolute',
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transperant',
          }}
        >
          {this.props.type === ProgressIndicatorTypes.IN_PROGRESS && (
            <ActivityIndicator color="white" />
          )}
          {this.props.type === ProgressIndicatorTypes.RETRY && (
            <Image source={iconReload} style={{ height: 25, width: 25 }} />
          )}
        </View>
      </TouchableOpacity>
    );
  }
}
