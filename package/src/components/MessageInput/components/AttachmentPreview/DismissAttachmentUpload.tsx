import React from 'react';

import { Pressable, PressableProps, StyleSheet } from 'react-native';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { Close } from '../../../../icons';

type DismissAttachmentUploadProps = PressableProps;

export const DismissAttachmentUpload = ({ onPress }: DismissAttachmentUploadProps) => {
  const {
    theme: {
      colors: { overlay, white },
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
        { backgroundColor: overlay, opacity: pressed ? 0.8 : 1 },
        dismiss,
      ]}
      testID='remove-upload-preview'
    >
      <Close pathFill={dismissIconColor || white} {...dismissIcon} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  dismiss: {
    borderRadius: 24,
    position: 'absolute',
    right: 8,
    top: 8,
  },
});
