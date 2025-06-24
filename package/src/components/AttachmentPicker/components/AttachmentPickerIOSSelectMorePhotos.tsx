import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { NativeHandlers } from '../../../native';

export const AttachmentPickerIOSSelectMorePhotos = () => {
  const { t } = useTranslationContext();
  const {
    theme: {
      colors: { accent_blue, white },
    },
  } = useTheme();

  if (!NativeHandlers.iOS14RefreshGallerySelection) {
    return null;
  }

  return (
    <Pressable
      onPress={NativeHandlers.iOS14RefreshGallerySelection}
      style={[styles.container, { backgroundColor: white }]}
    >
      <Text style={[styles.text, { color: accent_blue }]}>{t('Select More Photos')}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {},
  text: {
    fontSize: 16,
    paddingVertical: 10,
    textAlign: 'center',
  },
});
