import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAITranslation, useTheme } from '../contexts';
import { Close } from '../internal/icons/Close';
import { primitives } from '../internal/tokens';

/**
 * A way to ask, which the person picks for their next message, such as "Think harder".
 */
export type AIChatOption = {
  id: string;
  /** The option's name in the menu, such as "Think harder". */
  title: string;
  /** Data of your own, such as what the option sends with the message. */
  customData?: Record<string, unknown>;
  /** A line under the title in the menu, such as "Takes longer, for harder questions". */
  description?: string;
  /** An icon shown in the menu and on the chip. */
  icon?: ReactNode;
  /** The option's name on the chip once picked, such as "Think". Defaults to `title`. */
  shortTitle?: string;
};

export type ChatOptionsListProps = {
  onSelect: (option: AIChatOption) => void;
  options: AIChatOption[];
  selectedId?: string | null;
};

/**
 * The items of the chat options menu, one per option, each with its icon, title and description.
 * `ComposerView` shows them in its sheet, under the camera and photos.
 */
export const ChatOptionsList = ({ onSelect, options, selectedId }: ChatOptionsListProps) => {
  const {
    theme: { chatOptions: theme },
  } = useTheme();

  return (
    <View style={[styles.list, theme?.list]}>
      {options.map((option) => (
        <Pressable
          accessibilityRole='radio'
          accessibilityState={{ checked: option.id === selectedId }}
          key={option.id}
          onPress={() => onSelect(option)}
          style={({ pressed }) => [styles.item, { opacity: pressed ? 0.7 : 1 }, theme?.item]}
        >
          {option.icon ? (
            <View style={[styles.itemIcon, theme?.itemIcon]}>{option.icon}</View>
          ) : null}
          <View style={styles.itemText}>
            <Text style={[styles.itemTitle, { color: theme?.titleText }, theme?.itemTitle]}>
              {option.title}
            </Text>
            {option.description ? (
              <Text
                style={[
                  styles.itemDescription,
                  { color: theme?.descriptionText },
                  theme?.itemDescription,
                ]}
              >
                {option.description}
              </Text>
            ) : null}
          </View>
        </Pressable>
      ))}
    </View>
  );
};

export type SelectedChatOptionChipProps = {
  onRemove: () => void;
  option: AIChatOption;
  disabled?: boolean;
};

/** The picked option, with a button that removes it. */
export const SelectedChatOptionChip = ({
  disabled,
  onRemove,
  option,
}: SelectedChatOptionChipProps) => {
  const { t } = useAITranslation();
  const {
    theme: { chatOptions: theme },
  } = useTheme();
  const title = option.shortTitle ?? option.title;

  return (
    <View
      style={[styles.chip, { backgroundColor: theme?.chipBackground }, theme?.chip]}
      testID='ai-selected-chat-option'
    >
      {option.icon ? <View style={[styles.chipIcon, theme?.chipIcon]}>{option.icon}</View> : null}
      <Text style={[styles.chipTitle, { color: theme?.chipText }, theme?.chipTitle]}>{title}</Text>
      <Pressable
        accessibilityLabel={t('Remove option: {{ option }}', { option: title })}
        accessibilityRole='button'
        accessibilityState={{ disabled }}
        disabled={disabled}
        hitSlop={8}
        onPress={onRemove}
        style={[styles.chipRemoveButton, theme?.chipRemoveButton]}
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
  chipIcon: { alignItems: 'center', justifyContent: 'center' },
  chipRemoveButton: { alignItems: 'center', justifyContent: 'center' },
  chipTitle: {
    fontSize: primitives.typographyFontSizeMd,
    fontWeight: '600',
    lineHeight: primitives.typographyLineHeightNormal,
  },
  item: { alignItems: 'center', flexDirection: 'row', gap: primitives.spacingMd },
  itemDescription: {
    fontSize: primitives.typographyFontSizeSm,
    lineHeight: primitives.typographyLineHeightNormal,
  },
  itemIcon: { alignItems: 'center', justifyContent: 'center' },
  itemText: { flex: 1 },
  itemTitle: {
    fontSize: primitives.typographyFontSizeMd,
    fontWeight: '600',
    lineHeight: primitives.typographyLineHeightNormal,
  },
  list: { gap: primitives.spacingMd, paddingVertical: primitives.spacingMd },
});
