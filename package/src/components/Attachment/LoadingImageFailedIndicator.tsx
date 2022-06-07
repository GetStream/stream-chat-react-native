import React from 'react';
import { StyleSheet, Text, View, ViewProps } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

import { Warning } from '../../icons';

const WARNING_ICON_SIZE = 24;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'black',
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  roundedView: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 50,
    display: 'flex',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
});

export type LoadingImageFailedIndicatorProps = ViewProps;

export const LoadingImageFailedIndicator: React.FC<LoadingImageFailedIndicatorProps> = (props) => {
  const {
    theme: {
      colors: { accent_red, black },
      messageSimple: {
        videoThumbnail: { container },
      },
    },
  } = useTheme();

  const { t } = useTranslationContext();

  const { style, ...rest } = props;
  return (
    <View {...rest} style={[styles.container, container, style]}>
      <Warning height={WARNING_ICON_SIZE} pathFill={accent_red} width={WARNING_ICON_SIZE} />
      <Text {...rest} style={[{ color: black, fontSize: 10 }, style]}>
        {t('Error loading')}
      </Text>
    </View>
  );
};
