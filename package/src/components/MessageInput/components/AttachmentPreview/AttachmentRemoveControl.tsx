import React, { useMemo } from 'react';

import { Pressable, PressableProps, StyleSheet } from 'react-native';

import { useA11yLabel } from '../../../../a11y/hooks/useA11yLabel';
import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../../theme';

type AttachmentRemoveControlProps = PressableProps & {
  accessibilityLabelKey?: string;
  accessibilityLabelParams?: Record<string, unknown>;
};

export const AttachmentRemoveControl = ({
  accessibilityLabelKey = 'messageInput.removeAttachment.accessibilityLabel',
  accessibilityLabelParams,
  onPress,
  ...rest
}: AttachmentRemoveControlProps) => {
  const { icons } = useComponentsContext();
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
      <icons.NewClose
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
