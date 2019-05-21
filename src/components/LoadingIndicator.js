import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';

export class LoadingIndicator extends React.PureComponent {
  static propTypes = {
    listType: PropTypes.oneOf(['channel', 'message', 'default']),
  };

  static defaultProps = {
    listType: 'default',
  };

  render() {
    switch (this.props.listType) {
      case 'channel':
        return <Text>Loading channel list ...</Text>;
      case 'message':
        return <Text>Loading messages ...</Text>;
      case 'default':
      default:
        return <Text>Loading ...</Text>;
    }
  }
}
