import React from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  Image,
  ImageRequireSource,
  View,
} from 'react-native';

import { ProgressIndicatorTypes } from '../../utils/utils';

import { styled } from '../../../styles/styledComponents';

const iconReload: ImageRequireSource = require('../../../images/reload1.png');

const ActivityIndicatorContainer = styled.View`
  align-items: center;
  bottom: 0;
  justify-content: center;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
`;

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

const RetryButtonContainer = styled.TouchableOpacity`
  align-items: center;
  bottom: 0;
  justify-content: center;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
`;

export type UploadProgressIndicatorProps = {
  /** Action triggered when clicked indicator */
  action?: (event: GestureResponderEvent) => void;
  /** Boolean status of upload progress */
  active?: boolean;
  /** Type of active indicator */
  type?: 'in_progress' | 'retry';
};

export const UploadProgressIndicator: React.FC<UploadProgressIndicatorProps> = (
  props,
) => {
  const { action, active, children, type } = props;

  return !active ? (
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
};
