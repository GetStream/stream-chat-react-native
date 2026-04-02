import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AttachmentUploadIndicator } from './AttachmentUploadIndicator';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { primitives } from '../../theme';

export type AttachmentFileUploadProgressIndicatorProps = {
  totalBytes?: number | string | null;
  uploadProgress: number | undefined;
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
export const AttachmentFileUploadProgressIndicator = ({
  totalBytes,
  uploadProgress,
}: AttachmentFileUploadProgressIndicatorProps) => {
  const {
    theme: { semantics },
  } = useTheme();

  const progressLabel = useMemo(() => {
    const bytes = parseTotalBytes(totalBytes);
    if (bytes == null || bytes <= 0) {
      return null;
    }
    const uploaded = ((uploadProgress ?? 0) / 100) * bytes;
    return `${formatMegabytesOneDecimal(uploaded)} / ${formatMegabytesOneDecimal(bytes)}`;
  }, [totalBytes, uploadProgress]);

  return (
    <View style={styles.row}>
      <AttachmentUploadIndicator uploadProgress={uploadProgress} />
      {progressLabel ? (
        <Text numberOfLines={1} style={[styles.label, { color: semantics.textSecondary }]}>
          {progressLabel}
        </Text>
      ) : null}
    </View>
  );
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
