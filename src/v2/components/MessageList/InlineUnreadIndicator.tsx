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
    color: '#7A7A7A',
    fontSize: 12,
  },
});

export const InlineUnreadIndicator: React.FC = () => {
  const {
    theme: {
      messageList: {
        inlineUnreadIndicator: { container, text },
      },
    },
  } = useTheme();
  const { t } = useTranslationContext();

  return (
    <View style={[styles.container, container]}>
      <Text style={[styles.text, text]}>{t('Unread Messages')}</Text>
    </View>
  );
};
