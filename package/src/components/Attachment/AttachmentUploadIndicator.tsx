import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
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
  variant?: 'compact' | 'overlay';
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
  variant = 'compact',
}: AttachmentUploadIndicatorProps) => {
  const {
    theme: { semantics },
  } = useTheme();
  const { CircularProgressIndicator, MediaUploadProgressOverlay } = useComponentsContext();
  const pendingUpload = usePendingAttachmentUpload(localId);
  const uploadProgress = pendingUpload.uploadProgress;
  const shouldRender = pendingUpload.isUploading;
  const resolvedSize = variant === 'overlay' && size === 16 ? 28 : size;
  const resolvedStrokeWidth = variant === 'overlay' && strokeWidth === 2 ? 3 : strokeWidth;

  if (!shouldRender) {
    return null;
  }

  if (variant === 'overlay') {
    return (
      <MediaUploadProgressOverlay
        progress={uploadProgress}
        size={resolvedSize}
        strokeWidth={resolvedStrokeWidth}
        testID={testID}
      />
    );
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
          backgroundColor={semantics.backgroundCoreElevation0}
          filledColor={semantics.accentPrimary}
          progress={uploadProgress}
          size={resolvedSize}
          strokeWidth={resolvedStrokeWidth}
          style={style}
          testID={testID}
          unfilledColor={semantics.borderCoreDefault}
        />
      )}
    </View>
  );
};

export const AttachmentUploadIndicator = ({
  containerStyle,
  localId,
  sourceUrl,
  variant,
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
      variant={variant}
    />
  );
};

const styles = StyleSheet.create({
  indeterminateWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
