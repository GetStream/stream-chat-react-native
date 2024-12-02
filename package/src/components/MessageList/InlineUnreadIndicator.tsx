import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginTop: 2,
  },
  text: {
    fontSize: 12,
  },
});

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
    <View style={[styles.container, { backgroundColor: light_gray }, container]}>
      <Text style={[styles.text, { color: grey }, text]}>{t<string>('Unread Messages')}</Text>
    </View>
  );
};
