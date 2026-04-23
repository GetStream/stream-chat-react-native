import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { usePendingAttachmentUpload } from '../../hooks/usePendingAttachmentUpload';
import { primitives } from '../../theme';
import { isLocalUrl } from '../../utils/utils';

export type AttachmentFileUploadProgressIndicatorProps = {
  containerStyle?: StyleProp<ViewStyle>;
  localId?: string;
  sourceUrl?: string;
  totalBytes?: number | string | null;
};

const parseTotalBytes = (value: number | string | null | undefined): number | null => {
  if (value == null) {
    return null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const formatMegabytesOneDecimal = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0.0 MB';
  }
  return `${(bytes / (1000 * 1000)).toFixed(1)} MB`;
};

/**
 * Circular progress plus `uploaded / total` for file and audio attachments during upload.
 */
export const AttachmentFileUploadProgressIndicatorUI = ({
  containerStyle,
  localId,
  sourceUrl,
  totalBytes,
}: AttachmentFileUploadProgressIndicatorProps) => {
  const {
    theme: { semantics },
  } = useTheme();
  const { AttachmentUploadIndicator } = useComponentsContext();
  const shouldTrackPendingUpload = !!localId && !!sourceUrl && isLocalUrl(sourceUrl);
  const pendingUpload = usePendingAttachmentUpload(shouldTrackPendingUpload ? localId : undefined);
  const uploadProgress = pendingUpload.uploadProgress;
  const shouldRender = pendingUpload.isUploading;

  const progressLabel = useMemo(() => {
    const bytes = parseTotalBytes(totalBytes);
    if (bytes == null || bytes <= 0) {
      return null;
    }
    const uploaded = ((uploadProgress ?? 0) / 100) * bytes;
    return `${formatMegabytesOneDecimal(uploaded)} / ${formatMegabytesOneDecimal(bytes)}`;
  }, [totalBytes, uploadProgress]);

  if (!shouldRender) {
    return null;
  }

  return (
    <View style={[styles.row, containerStyle]}>
      <AttachmentUploadIndicator localId={localId} sourceUrl={sourceUrl} />
      {progressLabel ? (
        <Text numberOfLines={1} style={[styles.label, { color: semantics.textSecondary }]}>
          {progressLabel}
        </Text>
      ) : null}
    </View>
  );
};

export const AttachmentFileUploadProgressIndicator = (
  props: AttachmentFileUploadProgressIndicatorProps,
) => {
  const { localId, sourceUrl } = props;
  const shouldTrackPendingUpload = !!localId && !!sourceUrl && isLocalUrl(sourceUrl);

  if (!shouldTrackPendingUpload) {
    return null;
  }

  return <AttachmentFileUploadProgressIndicatorUI {...props} />;
};

const styles = StyleSheet.create({
  label: {
    flex: 1,
    flexShrink: 1,
    fontSize: primitives.typographyFontSizeXs,
    fontWeight: primitives.typographyFontWeightRegular,
    lineHeight: primitives.typographyLineHeightTight,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: primitives.spacingXxs,
  },
});
