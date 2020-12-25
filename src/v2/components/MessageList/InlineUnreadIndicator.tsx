import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    width: '100%',
  },
  text: {
    fontSize: 12,
  },
});

export const InlineUnreadIndicator: React.FC = () => {
  const {
    theme: {
      colors: { grey },
      messageList: {
        inlineUnreadIndicator: { container, text },
      },
    },
  } = useTheme();
  const { t } = useTranslationContext();

  return (
    <View style={[styles.container, container]}>
      <Text style={[styles.text, { color: grey }, text]}>
        {t('Unread Messages')}
      </Text>
    </View>
  );
};
