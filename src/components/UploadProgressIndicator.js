import React from 'react';
import { View, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import iconReload from '../images/reload1.png';
import PropTypes from 'prop-types';
import styled from '@stream-io/styled-components';
import { ProgressIndicatorTypes } from '../utils';
import { themed } from '../styles/theme';

const Overlay = styled.View`
  position: absolute;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.3);
  opacity: 0;
  ${({ theme }) => theme.messageInput.uploadProgressIndicator.overlay.extra};
`;

const Container = styled.View`
  position: absolute;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0);
  ${({ theme }) => theme.messageInput.uploadProgressIndicator.container.extra};
`;

export const UploadProgressIndicator = themed(
  class UploadProgressIndicator extends React.PureComponent {
    static themePath = 'messageInput.uploadProgressIndicator';
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
      const { active, children, type } = this.props;
      if (!active) {
        return <View>{children}</View>;
      }

      return (
        <TouchableOpacity onPress={this.props.action}>
          {children}
          <Overlay />
          <Container>
            {type === ProgressIndicatorTypes.IN_PROGRESS && (
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
            {type === ProgressIndicatorTypes.RETRY && (
              <Image source={iconReload} style={{ height: 18, width: 18 }} />
            )}
          </Container>
        </TouchableOpacity>
      );
    }
  },
);
