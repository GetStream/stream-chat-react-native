import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAITranslation, useTheme } from '../contexts';
import { useAIIcons } from '../icons';
import { Close } from '../internal/icons/Close';
import { primitives } from '../internal/tokens';

export type EditingMessageChipProps = {
  onCancel: () => void;
};

/** Says the person is editing a message they sent, with a button that cancels it. */
export const EditingMessageChip = ({ onCancel }: EditingMessageChipProps) => {
  const { t } = useAITranslation();
  const {
    theme: { chatOptions: theme, colors },
  } = useTheme();
  const { Edit } = useAIIcons();

  return (
    <View
      style={[styles.chip, { backgroundColor: theme?.chipBackground }, theme?.chip]}
      testID='ai-editing-message'
    >
      <View style={[styles.icon, theme?.chipIcon]}>
        <Edit color={theme?.chipText ?? colors.accent_blue} size={16} />
      </View>
      <Text style={[styles.title, { color: theme?.chipText }, theme?.chipTitle]}>
        {t('Editing message')}
      </Text>
      <Pressable
        accessibilityLabel={t('Cancel editing')}
        accessibilityRole='button'
        hitSlop={8}
        onPress={onCancel}
        style={[styles.removeButton, theme?.chipRemoveButton]}
      >
        <Close height={20} pathFill={theme?.chipText} width={20} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: primitives.radiusXl,
    flexDirection: 'row',
    gap: primitives.spacingXs,
    padding: primitives.spacingXs,
  },
  icon: { alignItems: 'center', justifyContent: 'center' },
  removeButton: { alignItems: 'center', justifyContent: 'center' },
  title: {
    fontSize: primitives.typographyFontSizeMd,
    fontWeight: '600',
    lineHeight: primitives.typographyLineHeightNormal,
  },
});
