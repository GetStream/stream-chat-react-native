import React from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Refresh } from '../../icons';
import { ProgressIndicatorTypes } from '../../utils/utils';

const REFRESH_ICON_SIZE = 18;

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
    height: '100%',
    justifyContent: 'center',
    position: 'absolute',
    width: '100%',
  },
  overflowHidden: {
    overflow: 'hidden',
  },
  overlay: {
    alignItems: 'center',
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
});

export type UploadProgressIndicatorProps = {
  /** Action triggered when clicked indicator */
  action?: (event: GestureResponderEvent) => void;
  /** style */
  style?: StyleProp<ViewStyle>;
  /** Type of active indicator */
  type?: 'in_progress' | 'retry' | 'not_supported' | 'inactive' | null;
};

export const UploadProgressIndicator: React.FC<UploadProgressIndicatorProps> = (props) => {
  const { action, children, style, type } = props;

  const {
    theme: {
      colors: { overlay: overlayColor },
      messageInput: {
        uploadProgressIndicator: { container },
      },
    },
  } = useTheme();

  return type === ProgressIndicatorTypes.INACTIVE ? (
    <View style={[styles.overflowHidden, style]} testID='inactive-upload-progress-indicator'>
      {children}
    </View>
  ) : (
    <View style={[styles.overflowHidden, style]} testID='active-upload-progress-indicator'>
      {children}
      <View
        style={[
          type === ProgressIndicatorTypes.NOT_SUPPORTED ? styles.overflowHidden : styles.container,
          { backgroundColor: overlayColor },
          container,
        ]}
        testID='not-supported-upload-progress-indicator'
      >
        {type === ProgressIndicatorTypes.IN_PROGRESS && <InProgressIndicator />}
        {type === ProgressIndicatorTypes.RETRY && <RetryIndicator action={action} />}
      </View>
    </View>
  );
};

const InProgressIndicator = () => {
  const {
    theme: {
      colors: { white_smoke },
    },
  } = useTheme();

  return (
    <View style={styles.activityIndicatorContainer}>
      <ActivityIndicator color={white_smoke} testID='upload-progress-indicator' />
    </View>
  );
};

const RetryIndicator = ({ action }: Pick<UploadProgressIndicatorProps, 'action'>) => {
  const {
    theme: {
      colors: { white_smoke },
    },
  } = useTheme();

  return (
    <TouchableOpacity onPress={action} style={styles.retryButtonContainer}>
      <Refresh
        height={REFRESH_ICON_SIZE}
        pathFill={white_smoke}
        testID='retry-upload-progress-indicator'
        width={REFRESH_ICON_SIZE}
      />
    </TouchableOpacity>
  );
};

UploadProgressIndicator.displayName =
  'UploadProgressIndicator{messageInput{uploadProgressIndicator}}';
