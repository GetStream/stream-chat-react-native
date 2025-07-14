import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

export const InlineUnreadIndicator = () => {
  const {
    theme: {
      colors: { grey, light_gray },
      messageList: {
        inlineUnreadIndicator: { container, text },
      },
    },
  } = useTheme();
  const { t } = useTranslationContext();

  return (
    <View
      accessibilityLabel='Inline unread indicator'
      style={[styles.container, { backgroundColor: light_gray }, container]}
    >
      <Text style={[styles.text, { color: grey }, text]}>{t('Unread Messages')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    padding: 10,
  },
  text: {
    fontSize: 12,
  },
});
