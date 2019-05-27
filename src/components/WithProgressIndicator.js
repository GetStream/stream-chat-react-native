import React from 'react';
import { View, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import iconReload from '../images/reload1.png';
import PropTypes from 'prop-types';
import styled from '@stream-io/styled-components';
import { ProgressIndicatorTypes } from '../utils';

const Overlay = styled.View`
  position: ${({ theme }) => theme.withProgressIndicator.overlay.position};
  width: ${({ theme }) => theme.withProgressIndicator.overlay.width};
  height: ${({ theme }) => theme.withProgressIndicator.overlay.height};
  display: ${({ theme }) => theme.withProgressIndicator.overlay.display};
  align-items: ${({ theme }) => theme.withProgressIndicator.overlay.alignItems};
  justify-content: ${({ theme }) =>
    theme.withProgressIndicator.overlay.justifyContent};
  background-color: ${({ theme }) =>
    theme.withProgressIndicator.overlay.backgroundColor || 'transparent'};
  opacity: ${({ theme }) => theme.withProgressIndicator.overlay.opacity || 0};
`;

const Container = styled.View`
  position: ${({ theme }) => theme.withProgressIndicator.container.position};
  width: ${({ theme }) => theme.withProgressIndicator.container.width};
  height: ${({ theme }) => theme.withProgressIndicator.container.height};
  display: ${({ theme }) => theme.withProgressIndicator.container.display};
  align-items: ${({ theme }) =>
    theme.withProgressIndicator.container.alignItems};
  justify-content: ${({ theme }) =>
    theme.withProgressIndicator.container.justifyContent};
  background-color: ${({ theme }) =>
    theme.withProgressIndicator.container.backgroundColor};
`;

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
        <Overlay />
        <Container>
          {this.props.type === ProgressIndicatorTypes.IN_PROGRESS && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <ActivityIndicator style={{}} color="white" />
            </View>
          )}
          {this.props.type === ProgressIndicatorTypes.RETRY && (
            <Image source={iconReload} style={{ height: 18, width: 18 }} />
          )}
        </Container>
      </TouchableOpacity>
    );
  }
}
