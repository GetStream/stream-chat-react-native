import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';

const styles = StyleSheet.create({
  errorButtonText: {
    color: '#005FFF',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 24,
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    bottom: 0,
    left: 0,
    paddingTop: 16,
    position: 'absolute',
    right: 0,
  },
  errorText: {
    fontSize: 14,
    marginHorizontal: 24,
    marginTop: 16,
    textAlign: 'center',
  },
});

export type AttachmentPickerErrorProps = {
  AttachmentPickerErrorImage: React.ComponentType;
  attachmentPickerBottomSheetHeight?: number;
  attachmentPickerErrorButtonText?: string;
  attachmentPickerErrorText?: string;
};

export const AttachmentPickerError: React.FC<AttachmentPickerErrorProps> = (
  props,
) => {
  const {
    attachmentPickerBottomSheetHeight,
    attachmentPickerErrorButtonText,
    AttachmentPickerErrorImage,
    attachmentPickerErrorText,
  } = props;

  const {
    theme: {
      attachmentPicker: { errorButtonText, errorContainer, errorText },
    },
  } = useTheme();
  const { t } = useTranslationContext();

  return (
    <View
      style={[
        styles.errorContainer,
        { height: attachmentPickerBottomSheetHeight ?? 308 },
        errorContainer,
      ]}
    >
      <AttachmentPickerErrorImage />
      <Text style={[styles.errorText, errorText]}>
        {attachmentPickerErrorText ||
          t(
            'Please enable access to your photos and videos so you can share them.',
          )}
      </Text>
      <Text
        onPress={Linking.openSettings}
        style={[styles.errorButtonText, errorButtonText]}
        suppressHighlighting
      >
        {attachmentPickerErrorButtonText || t('Allow access to your Gallery')}
      </Text>
    </View>
  );
};
