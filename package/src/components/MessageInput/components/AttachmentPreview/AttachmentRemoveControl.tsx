import React, { useMemo } from 'react';

import { Pressable, PressableProps, StyleSheet } from 'react-native';

import { useA11yLabel } from '../../../../a11y/hooks/useA11yLabel';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { NewClose } from '../../../../icons/xmark';
import { primitives } from '../../../../theme';

type AttachmentRemoveControlProps = PressableProps & {
  accessibilityLabelKey?: string;
  accessibilityLabelParams?: Record<string, unknown>;
};

export const AttachmentRemoveControl = ({
  accessibilityLabelKey = 'a11y/Remove attachment',
  accessibilityLabelParams,
  onPress,
  ...rest
}: AttachmentRemoveControlProps) => {
  const {
    theme: {
      semantics,
      messageComposer: {
        dismissAttachmentUpload: { dismiss, dismissIcon, dismissIconColor },
      },
    },
  } = useTheme();
  const styles = useStyles();
  const translatedAccessibilityLabel = useA11yLabel(
    accessibilityLabelKey,
    accessibilityLabelParams,
  );

  return (
    <Pressable
      accessibilityLabel={translatedAccessibilityLabel}
      accessibilityRole='button'
      hitSlop={15}
      onPress={onPress}
      style={({ pressed }) => [
        styles.dismiss,
        {
          opacity: pressed ? 0.8 : 1,
        },
        dismiss,
      ]}
      testID='remove-upload-preview'
      {...rest}
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
