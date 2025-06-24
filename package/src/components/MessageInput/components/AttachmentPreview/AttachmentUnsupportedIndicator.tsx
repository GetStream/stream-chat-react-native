import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { Warning } from '../../../../icons/Warning';
import { Progress, ProgressIndicatorTypes } from '../../../../utils/utils';

const WARNING_ICON_SIZE = 16;

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
      colors: { accent_red, grey_dark, overlay, white },
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
      <Warning
        height={WARNING_ICON_SIZE}
        pathFill={accent_red}
        style={styles.warningIconStyle}
        width={WARNING_ICON_SIZE}
        {...warningIcon}
      />
      <Text style={[styles.warningText, { color: isImage ? white : grey_dark }, text]}>
        {t('Not supported')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  imageStyle: {
    borderRadius: 16,
    bottom: 8,
    position: 'absolute',
  },
  warningIconStyle: {
    borderRadius: 24,
    marginTop: 6,
  },
  warningText: {
    alignItems: 'center',
    color: 'black',
    fontSize: 10,
    justifyContent: 'center',
    marginHorizontal: 4,
  },
});
