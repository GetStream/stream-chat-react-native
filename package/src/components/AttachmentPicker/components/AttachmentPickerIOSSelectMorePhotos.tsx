import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { iOS14RefreshGallerySelection } from '../../../native';

export const AttachmentPickerIOSSelectMorePhotos = () => {
  const { t } = useTranslationContext();
  const {
    theme: {
      colors: { accent_blue, white },
    },
  } = useTheme();

  if (!iOS14RefreshGallerySelection) return null;

  return (
    <Pressable
      onPress={iOS14RefreshGallerySelection}
      style={[styles.container, { backgroundColor: white }]}
    >
      <Text style={[styles.text, { color: accent_blue }]}>{t<string>('Select More Photos')}</Text>
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
