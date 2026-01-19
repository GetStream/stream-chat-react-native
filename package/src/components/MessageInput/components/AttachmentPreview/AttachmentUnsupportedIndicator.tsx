import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { ErrorCircle } from '../../../../icons/ErrorCircle';
import { Progress, ProgressIndicatorTypes } from '../../../../utils/utils';

export type AttachmentUnsupportedIndicatorProps = {
  /** Type of active indicator */
  indicatorType?: Progress;
  /** Boolean to determine whether the attachment is an image */
  isImage?: boolean;
};

export const AttachmentUnsupportedIndicator = ({
  indicatorType,
  isImage = false,
}: AttachmentUnsupportedIndicatorProps) => {
  const {
    theme: {
      colors: { accent_error, overlay },
      messageInput: {
        attachmentUnsupportedIndicator: { container, text, warningIcon },
      },
    },
  } = useTheme();

  const { t } = useTranslationContext();

  if (indicatorType !== ProgressIndicatorTypes.NOT_SUPPORTED) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        isImage ? [styles.imageStyle, { backgroundColor: overlay }] : null,
        container,
      ]}
    >
      <ErrorCircle
        fill={accent_error}
        height={20}
        style={styles.warningIconStyle}
        width={20}
        {...warningIcon}
      />
      <Text style={[styles.warningText, { color: accent_error }, text]}>{t('Not supported')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 4,
  },
  imageStyle: {
    borderRadius: 16,
    bottom: 8,
    position: 'absolute',
  },
  warningIconStyle: {
    borderRadius: 24,
  },
  warningText: {
    alignItems: 'center',
    color: 'black',
    fontSize: 12,
    marginHorizontal: 4,
  },
});
