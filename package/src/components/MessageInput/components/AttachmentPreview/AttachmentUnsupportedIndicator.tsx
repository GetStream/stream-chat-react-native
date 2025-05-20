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
};

export const AttachmentUnsupportedIndicator = ({
  indicatorType,
}: AttachmentUnsupportedIndicatorProps) => {
  const {
    theme: {
      colors: { accent_red, overlay, white },
    },
  } = useTheme();

  const { t } = useTranslationContext();

  if (indicatorType !== ProgressIndicatorTypes.NOT_SUPPORTED) {
    return null;
  }

  return (
    <View style={[styles.unsupportedImage, { backgroundColor: overlay }]}>
      <View style={[styles.iconContainer]}>
        <Warning
          height={WARNING_ICON_SIZE}
          pathFill={accent_red}
          style={styles.warningIconStyle}
          width={WARNING_ICON_SIZE}
        />
        <Text style={[styles.warningText, { color: white }]}>{t<string>('Not supported')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  unsupportedImage: {
    borderRadius: 20,
    bottom: 8,
    flexDirection: 'row',
    marginHorizontal: 3,
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
