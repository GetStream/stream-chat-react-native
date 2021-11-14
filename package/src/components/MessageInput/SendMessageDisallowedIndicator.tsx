import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderTopWidth: 1,
    height: 50,
    justifyContent: 'center',
  },
  text: {
    fontSize: 17,
    fontWeight: '400',
  },
});

export const SendMessageDisallowedIndicator = () => {
  const { t } = useTranslationContext();
  const {
    theme: {
      colors: { border, grey_dark },
      messageInput: {
        sendMessageDisallowedIndicator: { container, text },
      },
    },
  } = useTheme();
  return (
    <View
      style={[
        styles.container,
        {
          borderTopColor: border,
          height: 50,
        },
        container,
      ]}
    >
      <Text style={[styles.text, { color: grey_dark }, text]}>
        {t("You can't send messages in this channel")}
      </Text>
    </View>
  );
};
