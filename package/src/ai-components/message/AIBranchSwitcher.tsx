import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAITranslation, useTheme } from '../contexts';
import { useAIIcons } from '../icons';
import { primitives } from '../internal/tokens';

/**
 * Which of a message's versions shows, and how to show the others: a reply written again, or a
 * question the person edited. `index` is 1-based.
 */
export type AIBranchSwitch = {
  /** How many versions there are. The switcher shows only when there are two or more. */
  count: number;
  /** Which version shows, from 1 to `count`. */
  index: number;
  /** Shows the next version. Without it, the next arrow is disabled. */
  onNext?: () => void;
  /** Shows the previous version. Without it, the previous arrow is disabled. */
  onPrevious?: () => void;
};

export type AIBranchSwitcherProps = AIBranchSwitch;

/**
 * ‹ i/n ›: which version of a message shows, with arrows to the previous and the next one. Each
 * arrow is disabled at its end. Renders nothing while there is one version.
 */
export const AIBranchSwitcher = ({ count, index, onNext, onPrevious }: AIBranchSwitcherProps) => {
  const { t } = useAITranslation();
  const {
    theme: { colors, message },
  } = useTheme();
  const { Chevron } = useAIIcons();
  if (!(count > 1)) return null;
  const styles = message?.branchSwitcher;
  const color = message?.messageAction ?? colors.grey_dark;
  const hasPrevious = !!onPrevious && index > 1;
  const hasNext = !!onNext && index < count;
  return (
    <View
      accessibilityLabel={t('Version {{ index }} of {{ total }}', { index, total: count })}
      style={[defaultStyles.container, styles?.container]}
      testID='ai-branch-switcher'
    >
      <Pressable
        accessibilityLabel={t('Previous version')}
        accessibilityRole='button'
        accessibilityState={{ disabled: !hasPrevious }}
        disabled={!hasPrevious}
        hitSlop={4}
        onPress={onPrevious}
        style={({ pressed }) => [
          defaultStyles.button,
          { opacity: !hasPrevious ? 0.3 : pressed ? 0.5 : 1 },
          styles?.button,
        ]}
        testID='ai-branch-switcher-previous'
      >
        <View style={defaultStyles.backwards}>
          <Chevron color={color} size={16} />
        </View>
      </Pressable>
      <Text
        accessibilityElementsHidden
        importantForAccessibility='no-hide-descendants'
        style={[defaultStyles.position, { color }, styles?.position]}
      >
        {index}/{count}
      </Text>
      <Pressable
        accessibilityLabel={t('Next version')}
        accessibilityRole='button'
        accessibilityState={{ disabled: !hasNext }}
        disabled={!hasNext}
        hitSlop={4}
        onPress={onNext}
        style={({ pressed }) => [
          defaultStyles.button,
          { opacity: !hasNext ? 0.3 : pressed ? 0.5 : 1 },
          styles?.button,
        ]}
        testID='ai-branch-switcher-next'
      >
        <Chevron color={color} size={16} />
      </Pressable>
    </View>
  );
};

const defaultStyles = StyleSheet.create({
  // The chevron points to the next version; turned around, to the previous.
  backwards: { transform: [{ rotate: '180deg' }] },
  // As tall as the reply's actions beside it.
  button: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 28,
  },
  container: { alignItems: 'center', flexDirection: 'row' },
  position: {
    fontSize: primitives.typographyFontSizeXs,
    fontVariant: ['tabular-nums'],
  },
});
