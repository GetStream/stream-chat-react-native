import React from 'react';
import { View } from 'react-native';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';
import { Spinner } from './spinner';

const LoadingText = styled.Text`
  margin-top: 20px;
  font-size: 14px;
  font-weight: 600;
`;

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
        return (
          <View
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            <Spinner />
            <LoadingText>Loading channels ...</LoadingText>
          </View>
        );
      case 'message':
        return (
          <View
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            <Spinner />
            <LoadingText>Loading messages ...</LoadingText>
          </View>
        );
      case 'default':
      default:
        return (
          <View
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            <Spinner />
            <LoadingText>Loading ...</LoadingText>
          </View>
        );
    }
  }
}
