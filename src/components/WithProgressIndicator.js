import React from 'react';
import { View, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import iconReload from '../images/reload1.png';
import PropTypes from 'prop-types';
import styled from '@stream-io/styled-components';
import { getTheme } from '../styles/theme';
import { ProgressIndicatorTypes } from '../utils';

const Overlay = styled.View`
  position: ${(props) =>
    getTheme(props).withProgressIndicator.overlay.position};
  width: ${(props) => getTheme(props).withProgressIndicator.overlay.width};
  height: ${(props) => getTheme(props).withProgressIndicator.overlay.height};
  display: ${(props) => getTheme(props).withProgressIndicator.overlay.display};
  align-items: ${(props) =>
    getTheme(props).withProgressIndicator.overlay.alignItems};
  justify-content: ${(props) =>
    getTheme(props).withProgressIndicator.overlay.justifyContent};
  background-color: ${(props) =>
    getTheme(props).withProgressIndicator.overlay.backgroundColor ||
    'transparent'};
  opacity: ${(props) =>
    getTheme(props).withProgressIndicator.overlay.opacity || 0};
`;

const Container = styled.View`
  position: ${(props) =>
    getTheme(props).withProgressIndicator.container.position};
  width: ${(props) => getTheme(props).withProgressIndicator.container.width};
  height: ${(props) => getTheme(props).withProgressIndicator.container.height};
  display: ${(props) =>
    getTheme(props).withProgressIndicator.container.display};
  align-items: ${(props) =>
    getTheme(props).withProgressIndicator.container.alignItems};
  justify-content: ${(props) =>
    getTheme(props).withProgressIndicator.container.justifyContent};
  background-color: ${(props) =>
    getTheme(props).withProgressIndicator.container.backgroundColor};
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
