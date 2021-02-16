import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

const styles = StyleSheet.create({
  errorNotification: {
    alignItems: 'center',
    left: 0,
    paddingVertical: 4,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  errorNotificationText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});

export const NetworkDownIndicator = () => {
  const {
    theme: {
      colors: { grey },
      messageList: { errorNotification, errorNotificationText },
    },
  } = useTheme();
  const { t } = useTranslationContext();

  return (
    <View
      style={[
        styles.errorNotification,
        { backgroundColor: `${grey}E6` },
        errorNotification,
      ]}
      testID='error-notification'
    >
      <Text style={[styles.errorNotificationText, errorNotificationText]}>
        {t('Reconnecting...')}
      </Text>
    </View>
  );
};
