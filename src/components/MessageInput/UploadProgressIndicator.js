import React from 'react';
import { ActivityIndicator, Image, TouchableOpacity, View } from 'react-native';
import PropTypes from 'prop-types';
import styled from '@stream-io/styled-components';

import iconReload from '../../images/reload1.png';
import { ProgressIndicatorTypes } from '../../utils';
import { themed } from '../../styles/theme';

const Overlay = styled.View`
  position: absolute;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.3);
  opacity: 0;
  ${({ theme }) => theme.messageInput.uploadProgressIndicator.overlay.css};
`;

const Container = styled.View`
  position: absolute;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0);
  ${({ theme }) => theme.messageInput.uploadProgressIndicator.container.css};
`;

class UploadProgressIndicator extends React.PureComponent {
  static themePath = 'messageInput.uploadProgressIndicator';
  constructor(props) {
    super(props);
  }

  static propTypes = {
    action: PropTypes.func,
    active: PropTypes.bool,
    type: PropTypes.oneOf([
      ProgressIndicatorTypes.IN_PROGRESS,
      ProgressIndicatorTypes.RETRY,
    ]),
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
                alignItems: 'center',
                bottom: 0,
                justifyContent: 'center',
                left: 0,
                position: 'absolute',
                right: 0,
                top: 0,
              }}
            >
              <ActivityIndicator color='white' style={{}} />
            </View>
          )}
          {type === ProgressIndicatorTypes.RETRY && (
            <Image source={iconReload} style={{ height: 18, width: 18 }} />
          )}
        </Container>
      </TouchableOpacity>
    );
  }
}

export default themed(UploadProgressIndicator);
