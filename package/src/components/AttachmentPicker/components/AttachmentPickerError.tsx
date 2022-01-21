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

export const AttachmentPickerError: React.FC<AttachmentPickerErrorProps> = (props) => {
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
  } = useTheme('AttachmentPickerBottomError');
  const { t } = useTranslationContext('AttachmentPickerError');

  const { closePicker, setSelectedPicker } = useAttachmentPickerContext('AttachmentPickerError');

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
          height: attachmentPickerBottomSheetHeight ?? 308,
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
