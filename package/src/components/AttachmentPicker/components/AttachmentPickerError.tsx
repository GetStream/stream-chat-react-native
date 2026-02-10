import React, { useMemo } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { useAttachmentPickerContext } from '../../../contexts/attachmentPickerContext/AttachmentPickerContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { primitives } from '../../../theme';
import { Button } from '../../ui';

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        errorContainer: {
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: semantics.backgroundElevationElevation1,
          paddingHorizontal: primitives.spacing2xl,
          paddingBottom: primitives.spacing3xl,
        },
        errorText: {
          fontSize: 14,
          marginTop: 8,
          marginHorizontal: 24,
          textAlign: 'center',
        },
      }),
    [semantics.backgroundElevationElevation1],
  );
};

export type AttachmentPickerErrorProps = {
  AttachmentPickerErrorImage: React.ComponentType;
  attachmentPickerBottomSheetHeight?: number;
  attachmentPickerErrorButtonText?: string;
  attachmentPickerErrorText?: string;
};

/**
 * @deprecated
 */
export const AttachmentPickerError = (props: AttachmentPickerErrorProps) => {
  const {
    attachmentPickerBottomSheetHeight,
    attachmentPickerErrorButtonText,
    AttachmentPickerErrorImage,
    attachmentPickerErrorText,
  } = props;
  const styles = useStyles();

  const {
    theme: {
      colors: { grey },
    },
  } = useTheme();
  const { t } = useTranslationContext();

  const { closePicker, attachmentPickerStore } = useAttachmentPickerContext();

  const openSettings = async () => {
    try {
      attachmentPickerStore.setSelectedPicker(undefined);
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
          height: attachmentPickerBottomSheetHeight,
        },
      ]}
    >
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <AttachmentPickerErrorImage />
        <Text style={[styles.errorText, { color: grey }]}>
          {attachmentPickerErrorText || t('You have not granted access to the photo library.')}
        </Text>
      </View>
      <Button
        variant={'secondary'}
        type={'outline'}
        size={'lg'}
        label={attachmentPickerErrorButtonText || t('Change in Settings')}
        onPress={openSettings}
      />
    </View>
  );
};
