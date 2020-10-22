import React from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  Image,
  ImageRequireSource,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { ProgressIndicatorTypes } from '../../utils/utils';

const iconReload: ImageRequireSource = require('../../../images/reload1.png');

const styles = StyleSheet.create({
  activityIndicatorContainer: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  container: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF00',
    height: '100%',
    justifyContent: 'center',
    position: 'absolute',
    width: '100%',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: '#0000004D', // 4D = 30% opacity
    height: '100%',
    justifyContent: 'center',
    opacity: 0,
    position: 'absolute',
    width: '100%',
  },
  retryButtonContainer: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  retryButtonImage: { height: 18, width: 18 },
});

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

  const {
    theme: {
      messageInput: {
        uploadProgressIndicator: { container, overlay },
      },
    },
  } = useTheme();

  return !active ? (
    <View testID='inactive-upload-progress-indicator'>{children}</View>
  ) : (
    <View testID='active-upload-progress-indicator'>
      {children}
      <View style={[styles.overlay, overlay]} />
      <View style={[styles.container, container]}>
        {type === ProgressIndicatorTypes.IN_PROGRESS && (
          <View style={styles.activityIndicatorContainer}>
            <ActivityIndicator
              color='grey'
              testID='upload-progress-indicator'
            />
          </View>
        )}
        {type === ProgressIndicatorTypes.RETRY && (
          <TouchableOpacity
            onPress={action}
            style={styles.retryButtonContainer}
          >
            <Image
              source={iconReload}
              style={styles.retryButtonImage}
              testID='retry-upload-progress-indicator'
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

UploadProgressIndicator.displayName =
  'UploadProgressIndicator{messageInput{uploadProgressIndicator}}';
