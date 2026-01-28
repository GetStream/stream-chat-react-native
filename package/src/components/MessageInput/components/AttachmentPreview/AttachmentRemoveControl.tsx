import React, { useMemo } from 'react';

import { Pressable, PressableProps, StyleSheet } from 'react-native';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { NewClose } from '../../../../icons/NewClose';
import { primitives } from '../../../../theme';

type AttachmentRemoveControlProps = PressableProps;

export const AttachmentRemoveControl = ({ onPress }: AttachmentRemoveControlProps) => {
  const {
    theme: {
      semantics,
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
      <NewClose
        height={16}
        stroke={dismissIconColor || semantics.controlRemoveControlIcon}
        {...dismissIcon}
        width={16}
      />
    </Pressable>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();

  const { controlRemoveControlBg, controlRemoveControlBorder } = semantics;

  return useMemo(
    () =>
      StyleSheet.create({
        dismiss: {
          backgroundColor: controlRemoveControlBg,
          borderColor: controlRemoveControlBorder,
          borderRadius: primitives.radiusXl,
          borderWidth: 2,
          overflow: 'hidden',
        },
      }),
    [controlRemoveControlBg, controlRemoveControlBorder],
  );
};
