import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { CircularProgressIndicator } from './CircularProgressIndicator';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { usePendingAttachmentUpload } from '../../hooks/usePendingAttachmentUpload';
import { isLocalUrl } from '../../utils/utils';

export type AttachmentUploadIndicatorProps = {
  containerStyle?: StyleProp<ViewStyle>;
  localId?: string;
  size?: number;
  sourceUrl?: string;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Upload state for attachment previews: determinate ring when progress is known, otherwise `ActivityIndicator`.
 */
export const AttachmentUploadIndicatorUI = ({
  containerStyle,
  localId,
  size = 16,
  strokeWidth = 2,
  style,
  testID,
}: AttachmentUploadIndicatorProps) => {
  const {
    theme: { semantics },
  } = useTheme();
  const pendingUpload = usePendingAttachmentUpload(localId);
  const uploadProgress = pendingUpload.uploadProgress;
  const shouldRender = pendingUpload.isUploading;

  if (!shouldRender) {
    return null;
  }

  return (
    <View pointerEvents='none' style={containerStyle}>
      {uploadProgress === undefined ? (
        <View
          pointerEvents='none'
          style={[styles.indeterminateWrap, { height: size, width: size }, style]}
          testID={testID}
        >
          <ActivityIndicator color={semantics.accentPrimary} size='small' />
        </View>
      ) : (
        <CircularProgressIndicator
          color={semantics.accentPrimary}
          progress={uploadProgress}
          size={size}
          strokeWidth={strokeWidth}
          style={style}
          testID={testID}
        />
      )}
    </View>
  );
};

export const AttachmentUploadIndicator = ({
  containerStyle,
  localId,
  sourceUrl,
  ...props
}: AttachmentUploadIndicatorProps) => {
  const shouldTrackPendingUpload = !!localId && !!sourceUrl && isLocalUrl(sourceUrl);

  if (!shouldTrackPendingUpload) {
    return null;
  }

  return (
    <AttachmentUploadIndicatorUI
      {...props}
      containerStyle={containerStyle}
      localId={localId}
    />
  );
};

const styles = StyleSheet.create({
  indeterminateWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
