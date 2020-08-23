import React from 'react';
import { ActivityIndicator, Image, TouchableOpacity, View } from 'react-native';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';

import iconReload from '../../images/reload1.png';

import { themed } from '../../styles/theme';

import { ProgressIndicatorTypes } from '../../utils';

const Container = styled.View`
  align-items: center;
  background-color: rgba(255, 255, 255, 0);
  height: 100%;
  justify-content: center;
  position: absolute;
  width: 100%;
  ${({ theme }) => theme.messageInput.uploadProgressIndicator.container.css};
`;

const Overlay = styled.View`
  align-items: center;
  background-color: rgba(0, 0, 0, 0.3);
  height: 100%;
  justify-content: center;
  opacity: 0;
  position: absolute;
  width: 100%;
  ${({ theme }) => theme.messageInput.uploadProgressIndicator.overlay.css};
`;

const UploadProgressIndicator = ({ action, active, children, type }) =>
  !active ? (
    <View testID='inactive-upload-progress-indicator'>{children}</View>
  ) : (
    <TouchableOpacity
      onPress={action}
      testID='active-upload-progress-indicator'
    >
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
            <ActivityIndicator
              color='white'
              testID='upload-progress-indicator'
            />
          </View>
        )}
        {type === ProgressIndicatorTypes.RETRY && (
          <Image
            source={iconReload}
            style={{ height: 18, width: 18 }}
            testID='retry-upload-progress-indicator'
          />
        )}
      </Container>
    </TouchableOpacity>
  );

UploadProgressIndicator.propTypes = {
  /** Action triggered when clicked indicator */
  action: PropTypes.func,
  /** Boolean status of upload progress */
  active: PropTypes.bool,
  /** Type of active indicator */
  type: PropTypes.oneOf([
    ProgressIndicatorTypes.IN_PROGRESS,
    ProgressIndicatorTypes.RETRY,
  ]),
};

UploadProgressIndicator.themePath = 'messageInput.uploadProgressIndicator';

export default themed(UploadProgressIndicator);
