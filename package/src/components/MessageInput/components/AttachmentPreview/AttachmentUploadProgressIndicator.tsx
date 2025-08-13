import React, { PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { Refresh } from '../../../../icons';
import { Progress, ProgressIndicatorTypes } from '../../../../utils/utils';

const REFRESH_ICON_SIZE = 18;

export type AttachmentUploadProgressIndicatorProps = {
  /** Action triggered when clicked indicator */
  onPress?: PressableProps['onPress'];
  /** style */
  style?: StyleProp<ViewStyle>;
  /** Type of active indicator */
  type?: Progress;
};

export const AttachmentUploadProgressIndicator = (
  props: PropsWithChildren<AttachmentUploadProgressIndicatorProps>,
) => {
  const { onPress, children, style, type } = props;

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
        {type === ProgressIndicatorTypes.RETRY && <RetryIndicator onPress={onPress} />}
      </View>
    </View>
  );
};

const InProgressIndicator = () => {
  const {
    theme: {
      colors: { white_smoke },
      messageInput: {
        uploadProgressIndicator: { indicatorColor },
      },
    },
  } = useTheme();

  return (
    <View style={styles.activityIndicatorContainer}>
      <ActivityIndicator color={indicatorColor || white_smoke} testID='upload-progress-indicator' />
    </View>
  );
};

const RetryIndicator = ({ onPress }: Pick<AttachmentUploadProgressIndicatorProps, 'onPress'>) => {
  const {
    theme: {
      colors: { white_smoke },
      messageInput: {
        uploadProgressIndicator: { indicatorColor },
      },
    },
  } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.retryButtonContainer, { opacity: pressed ? 0.8 : 1 }]}
    >
      <Refresh
        height={REFRESH_ICON_SIZE}
        pathFill={indicatorColor || white_smoke}
        testID='retry-upload-progress-indicator'
        width={REFRESH_ICON_SIZE}
      />
    </Pressable>
  );
};

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

AttachmentUploadProgressIndicator.displayName =
  'AttachmentUploadProgressIndicator{messageInput{uploadProgressIndicator}}';
