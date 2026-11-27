import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { primitives } from '../../theme';

/** Shown in the composer while editing a scheduled message whose quoted message was deleted. */
export const QuoteDeletedNotice = () => {
  const messageComposer = useMessageComposer();
  const { icons } = useComponentsContext();
  const { t } = useTranslationContext();
  const {
    theme: {
      scheduledMessages: { notice: noticeTheme },
      semantics,
    },
  } = useTheme();

  return (
    <View
      accessibilityLiveRegion='polite'
      style={[
        styles.container,
        { backgroundColor: semantics.backgroundUtilityErrorSubtle },
        noticeTheme.container,
      ]}
      testID='scheduled-message-quote-deleted'
    >
      <icons.ExclamationCircle height={16} stroke={semantics.accentError} width={16} />
      <Text style={[styles.title, { color: semantics.textPrimary }, noticeTheme.title]}>
        {t('scheduledMessages.quoteDeleted.title', 'The quoted message was deleted')}
      </Text>
      <Pressable
        accessibilityRole='button'
        hitSlop={8}
        onPress={() => messageComposer.setQuotedMessage(null)}
        testID='scheduled-message-remove-quote'
      >
        <Text style={[styles.action, { color: semantics.textLink }]}>
          {t('scheduledMessages.removeQuote.label', 'Remove quote')}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  action: {
    fontSize: primitives.typographyFontSizeXs,
    fontWeight: primitives.typographyFontWeightSemiBold,
  },
  container: {
    alignItems: 'center',
    borderRadius: primitives.radiusLg,
    flexDirection: 'row',
    gap: primitives.spacingXs,
    paddingHorizontal: primitives.spacingSm,
    paddingVertical: primitives.spacingXs,
  },
  title: {
    flex: 1,
    fontSize: primitives.typographyFontSizeXs,
    fontWeight: primitives.typographyFontWeightSemiBold,
  },
});
