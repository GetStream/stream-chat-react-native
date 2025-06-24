import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { useAttachmentPickerContext } from '../../../contexts/attachmentPickerContext/AttachmentPickerContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';

const styles = StyleSheet.create({
  errorButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 24,
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
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

export const AttachmentPickerError = (props: AttachmentPickerErrorProps) => {
  const {
    attachmentPickerBottomSheetHeight,
    attachmentPickerErrorButtonText,
    AttachmentPickerErrorImage,
    attachmentPickerErrorText,
  } = props;

  const {
    theme: {
      attachmentPicker: { errorButtonText, errorContainer, errorText },
      colors: { accent_blue, grey, white_smoke },
    },
  } = useTheme();
  const { t } = useTranslationContext();

  const { closePicker, setSelectedPicker } = useAttachmentPickerContext();

  const openSettings = async () => {
    try {
      setSelectedPicker(undefined);
      closePicker();
      await Linking.openSettings();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View
      style={[
        styles.errorContainer,
        {
          backgroundColor: white_smoke,
          height: attachmentPickerBottomSheetHeight,
        },
        errorContainer,
      ]}
    >
      <AttachmentPickerErrorImage />
      <Text style={[styles.errorText, { color: grey }, errorText]}>
        {attachmentPickerErrorText ||
          t('Please enable access to your photos and videos so you can share them.')}
      </Text>
      <Text
        onPress={openSettings}
        style={[styles.errorButtonText, { color: accent_blue }, errorButtonText]}
        suppressHighlighting
      >
        {attachmentPickerErrorButtonText || t('Allow access to your Gallery')}
      </Text>
    </View>
  );
};
