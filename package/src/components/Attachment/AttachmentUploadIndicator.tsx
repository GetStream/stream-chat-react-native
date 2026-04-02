import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { CircularProgressIndicator } from './CircularProgressIndicator';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

export type AttachmentUploadIndicatorProps = {
  size?: number;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** When set, shows determinate `CircularProgressIndicator`; otherwise a generic spinner. */
  uploadProgress: number | undefined;
};

/**
 * Upload state for attachment previews: determinate ring when progress is known, otherwise `ActivityIndicator`.
 */
export const AttachmentUploadIndicator = ({
  size = 16,
  strokeWidth = 2,
  style,
  testID,
  uploadProgress,
}: AttachmentUploadIndicatorProps) => {
  const {
    theme: { semantics },
  } = useTheme();

  if (uploadProgress === undefined) {
    return (
      <View
        pointerEvents='none'
        style={[styles.indeterminateWrap, { height: size, width: size }, style]}
        testID={testID}
      >
        <ActivityIndicator color={semantics.accentPrimary} size='small' />
      </View>
    );
  }

  return (
    <CircularProgressIndicator
      color={semantics.accentPrimary}
      progress={uploadProgress}
      size={size}
      strokeWidth={strokeWidth}
      style={style}
      testID={testID}
    />
  );
};

const styles = StyleSheet.create({
  indeterminateWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
