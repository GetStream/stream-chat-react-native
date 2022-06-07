import React from 'react';
import { StyleSheet, Text, View, ViewProps } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

import { Warning } from '../../icons';

const WARNING_ICON_SIZE = 24;

const styles = StyleSheet.create({
  container: {
    alignContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 12,
  },
});

export type LoadingImageFailedIndicatorProps = ViewProps;

export const LoadingImageFailedIndicator: React.FC<LoadingImageFailedIndicatorProps> = (props) => {
  const {
    theme: {
      colors: { accent_red, black },
    },
  } = useTheme();

  const { t } = useTranslationContext();

  const { style, ...rest } = props;
  return (
    <View {...rest} style={[style]}>
      <View style={styles.container}>
        <Warning height={WARNING_ICON_SIZE} pathFill={accent_red} width={WARNING_ICON_SIZE} />
        <Text style={[styles.errorText, { color: black }]}>{t('Error loading')}</Text>
      </View>
    </View>
  );
};
