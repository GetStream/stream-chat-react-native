import React, { useMemo } from 'react';

import { Pressable, PressableProps, StyleSheet } from 'react-native';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { NewClose } from '../../../../icons/NewClose';

type AttachmentRemoveControlProps = PressableProps;

export const AttachmentRemoveControl = ({ onPress }: AttachmentRemoveControlProps) => {
  const {
    theme: {
      colors: { control },
      messageInput: {
        dismissAttachmentUpload: { dismiss, dismissIcon, dismissIconColor },
      },
    },
  } = useTheme();
  const styles = useStyles();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.dismiss,
        {
          opacity: pressed ? 0.8 : 1,
        },
        dismiss,
      ]}
      testID='remove-upload-preview'
    >
      <NewClose height={16} stroke={dismissIconColor || control.icon} {...dismissIcon} width={16} />
    </Pressable>
  );
};

const useStyles = () => {
  const {
    theme: {
      colors: { control },
      radius,
    },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        dismiss: {
          backgroundColor: control.bg,
          borderColor: control.border,
          borderRadius: radius.xl,
          borderWidth: 2,
          overflow: 'hidden',
        },
      }),
    [control, radius],
  );
};
