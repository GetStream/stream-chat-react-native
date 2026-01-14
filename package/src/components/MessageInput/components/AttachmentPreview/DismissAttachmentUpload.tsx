import React from 'react';

import { Pressable, PressableProps, StyleSheet } from 'react-native';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { NewClose } from '../../../../icons/NewClose';

type DismissAttachmentUploadProps = PressableProps;

export const DismissAttachmentUpload = ({ onPress }: DismissAttachmentUploadProps) => {
  const {
    theme: {
      colors: { white },
      messageInput: {
        dismissAttachmentUpload: { dismiss, dismissIcon, dismissIconColor },
      },
    },
  } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.dismiss,
        {
          borderColor: white,
          opacity: pressed ? 0.8 : 1,
        },
        dismiss,
      ]}
      testID='remove-upload-preview'
    >
      <NewClose height={16} stroke={dismissIconColor || white} {...dismissIcon} width={16} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  dismiss: {
    backgroundColor: '#384047',
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
  },
});
