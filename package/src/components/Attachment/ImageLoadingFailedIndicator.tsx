import React from 'react';
import { StyleSheet, Text, View, ViewProps } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

import { Warning } from '../../icons';

const WARNING_ICON_SIZE = 14;

const styles = StyleSheet.create({
  container: {
    alignContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 8,
    justifyContent: 'center',
    paddingRight: 8,
  },
  warningIconStyle: {
    borderRadius: 24,
    marginLeft: 4,
    marginTop: 6,
  },
});

export type ImageLoadingFailedIndicatorProps = ViewProps;

export const ImageLoadingFailedIndicator = (props: ImageLoadingFailedIndicatorProps) => {
  const {
    theme: {
      colors: { accent_red, overlay, white },
    },
  } = useTheme();

  const { t } = useTranslationContext();

  const { style, ...rest } = props;
  return (
    <View {...rest} accessibilityHint='error' style={[style]}>
      <View style={[styles.container, { backgroundColor: overlay }]}>
        <Warning
          height={WARNING_ICON_SIZE}
          pathFill={accent_red}
          style={styles.warningIconStyle}
          width={WARNING_ICON_SIZE}
        />
        <Text style={[styles.errorText, { color: white }]}>{t('Error loading')}</Text>
      </View>
    </View>
  );
};
