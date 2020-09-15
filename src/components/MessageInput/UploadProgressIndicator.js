import React from 'react';
import { ActivityIndicator, Image, View } from 'react-native';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';

import iconReload from '../../images/reload1.png';
import { themed } from '../../styles/theme';
import { ProgressIndicatorTypes } from '../../utils/utils';

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

const ActivityIndicatorContainer = styled.View`
  align-items: center;
  bottom: 0;
  justify-content: center;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
`;

const RetryButtonContainer = styled.TouchableOpacity`
  align-items: center;
  bottom: 0;
  justify-content: center;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
`;

const UploadProgressIndicator = ({ action, active, children, type }) =>
  !active ? (
    <View testID='inactive-upload-progress-indicator'>{children}</View>
  ) : (
    <View testID='active-upload-progress-indicator'>
      {children}
      <Overlay />
      <Container>
        {type === ProgressIndicatorTypes.IN_PROGRESS && (
          <ActivityIndicatorContainer>
            <ActivityIndicator
              color='grey'
              testID='upload-progress-indicator'
            />
          </ActivityIndicatorContainer>
        )}
        {type === ProgressIndicatorTypes.RETRY && (
          <RetryButtonContainer onPress={action}>
            <Image
              source={iconReload}
              style={{ height: 18, width: 18 }}
              testID='retry-upload-progress-indicator'
            />
          </RetryButtonContainer>
        )}
      </Container>
    </View>
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
